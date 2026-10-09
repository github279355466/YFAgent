#!/usr/bin/env node
/**
 * extract-sdd-metadata.mjs
 * 
 * 从 docs/sources/表结构信息/*.SDD 文件中抽取增量元数据：
 *   - PRIMARY KEY（复合主键用 + 分隔）
 *   - INDEX01~INDEX99（索引字段）
 *   - 文档类型分类（1~8）
 *   - 转档完成标记
 *   - 文件名（中文+英文）
 * 
 * 输出：
 *   knowledge/data-dictionary/sdd-table-meta.csv   — 每表一行
 *   knowledge/data-dictionary/sdd-index.csv        — 每索引一行
 * 
 * SDD 文件为 GBK 编码，Node.js 需用 iconv-lite 或 TextDecoder 解码。
 * 本脚本使用 Node.js 内置 TextDecoder('gbk') 避免外部依赖。
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const SDD_DIR = join(import.meta.dirname, '..', 'docs', 'sources', '表结构信息');
const OUT_DIR = join(import.meta.dirname, '..', 'knowledge', 'data-dictionary');

// 文档类型映射
const DOC_TYPE_MAP = {
  '1': '主档单头',
  '2': '主档单身',
  '3': '交易单头',
  '4': '交易单身',
  '5': '交易记录',
  '6': '月档/统计',
  '7': '系统档',
  '8': '其它',
};

function parseSddFile(filePath) {
  const buf = readFileSync(filePath);
  const decoder = new TextDecoder('gbk');
  const content = decoder.decode(buf);
  const lines = content.split(/\r?\n/);

  const tables = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测新表开始：文档代码:XXX
    const docCodeMatch = line.match(/^文档代码[:：]\s*(\S+)/);
    if (docCodeMatch) {
      if (current) tables.push(current);
      current = {
        doc_code: docCodeMatch[1].trim(),
        file_name_cn: '',
        file_name_en: '',
        doc_type_code: '',
        doc_type_cn: '',
        transfer_done: '',
        primary_keys: [],
        indexes: [],
        field_count: 0,
        source_file: basename(filePath),
      };
      continue;
    }

    if (!current) continue;

    // 文件名
    const fileNameMatch = line.match(/^文件名[:：]\s*(.+?)【(.+?)】/);
    if (fileNameMatch) {
      current.file_name_cn = fileNameMatch[1].trim();
      current.file_name_en = fileNameMatch[2].trim();
      continue;
    }

    // 类型
    const typeMatch = line.match(/^类\s*型[:：]\s*(\d)/);
    if (typeMatch) {
      current.doc_type_code = typeMatch[1];
      current.doc_type_cn = DOC_TYPE_MAP[typeMatch[1]] || '未知';
      continue;
    }

    // 转档完成
    const transferMatch = line.match(/^转档完成[:：]\s*(\S*)/);
    if (transferMatch) {
      current.transfer_done = transferMatch[1].trim() || '';
      continue;
    }

    // PRIMARY KEY（可能含 + 号表示复合主键）
    const pkMatch = line.match(/^PRIMARY\s*[:：]\s*(.+)/);
    if (pkMatch) {
      const raw = pkMatch[1].trim();
      current.primary_keys = raw.split('+').map(k => k.trim()).filter(Boolean);
      continue;
    }

    // INDEXnn
    const idxMatch = line.match(/^(INDEX\d+)\s*[:：]\s*(.+)/);
    if (idxMatch) {
      current.indexes.push({
        name: idxMatch[1].trim(),
        fields: idxMatch[2].trim().split('+').map(f => f.trim()).filter(Boolean),
      });
      continue;
    }

    // 字段行计数（序号开头 4 位数字）
    if (/^\d{4}\s+\S+/.test(line)) {
      current.field_count++;
    }
  }

  // 最后一个表
  if (current) tables.push(current);

  return tables;
}

// --- Main ---
const sddFiles = readdirSync(SDD_DIR)
  .filter(f => /\.sdd$/i.test(f))
  .sort();

console.log(`Found ${sddFiles.length} SDD files`);

const allTables = [];
for (const file of sddFiles) {
  const filePath = join(SDD_DIR, file);
  try {
    const tables = parseSddFile(filePath);
    allTables.push(...tables);
    console.log(`  ${file}: ${tables.length} tables`);
  } catch (err) {
    console.error(`  ERROR parsing ${file}: ${err.message}`);
  }
}

console.log(`\nTotal tables extracted: ${allTables.length}`);

// --- Output: sdd-table-meta.csv ---
const tableMetaHeader = 'doc_code,file_name_cn,file_name_en,doc_type_code,doc_type_cn,transfer_done,primary_keys,index_count,field_count,source_file';
const tableMetaRows = allTables.map(t => [
  t.doc_code,
  `"${t.file_name_cn.replace(/"/g, '""')}"`,
  `"${t.file_name_en.replace(/"/g, '""')}"`,
  t.doc_type_code,
  t.doc_type_cn,
  t.transfer_done,
  `"${t.primary_keys.join('+')}"`,
  t.indexes.length,
  t.field_count,
  t.source_file,
].join(','));

const tableMetaCsv = '\uFEFF' + [tableMetaHeader, ...tableMetaRows].join('\n');
writeFileSync(join(OUT_DIR, 'sdd-table-meta.csv'), tableMetaCsv, 'utf8');
console.log(`Written: sdd-table-meta.csv (${allTables.length} rows)`);

// --- Output: sdd-index.csv ---
const indexHeader = 'doc_code,index_name,index_fields';
const indexRows = [];
for (const t of allTables) {
  for (const idx of t.indexes) {
    indexRows.push([
      t.doc_code,
      idx.name,
      `"${idx.fields.join('+')}"`,
    ].join(','));
  }
}

const indexCsv = '\uFEFF' + [indexHeader, ...indexRows].join('\n');
writeFileSync(join(OUT_DIR, 'sdd-index.csv'), indexCsv, 'utf8');
console.log(`Written: sdd-index.csv (${indexRows.length} rows)`);

// --- Summary stats ---
const typeStats = {};
const pkStats = { single: 0, composite: 0, none: 0 };
for (const t of allTables) {
  typeStats[t.doc_type_cn] = (typeStats[t.doc_type_cn] || 0) + 1;
  if (t.primary_keys.length === 0) pkStats.none++;
  else if (t.primary_keys.length === 1) pkStats.single++;
  else pkStats.composite++;
}

console.log('\n--- Doc Type Distribution ---');
for (const [type, count] of Object.entries(typeStats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}

console.log('\n--- Primary Key Stats ---');
console.log(`  Single PK: ${pkStats.single}`);
console.log(`  Composite PK: ${pkStats.composite}`);
console.log(`  No PK: ${pkStats.none}`);
console.log(`  Total indexes: ${indexRows.length}`);
