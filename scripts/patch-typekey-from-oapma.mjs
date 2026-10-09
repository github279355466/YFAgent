#!/usr/bin/env node
/**
 * patch-typekey-from-oapma.mjs — 从 OAPMA XML 补充 typekey_map.yaml 中缺失的服务
 *
 * 功能：
 *   1. 为已有 type_key 补充缺失的 operation（如 financial.institution +create/delete/update）
 *   2. 为 OAPMA 中存在但 typekey_map 中完全没有的 type_key 新增条目（如 subscription）
 *   3. 标注数据来源为 oapma_supplement
 *
 * 用法：
 *   node scripts/patch-typekey-from-oapma.mjs          # 执行补丁
 *   node scripts/patch-typekey-from-oapma.mjs --check   # 仅检查，不写盘
 *
 * 数据源：docs/sources/OAPMA-openapi服务清单.xml
 * 目标：knowledge/typekey/typekey_map.yaml
 */
import fs from 'node:fs';
// 无外部依赖，使用内置正则解析

const CHECK_ONLY = process.argv.includes('--check');
const YAML_PATH = 'knowledge/typekey/typekey_map.yaml';
const OAPMA_PATH = 'docs/sources/OAPMA-openapi服务清单.xml';

// === OP code → name mapping (from OAP2-003.SDD MA003) ===
const OP_MAP = {
  '01': 'create', '02': 'update', '03': 'delete',
  '04': 'read', '05': 'query', '06': 'approve',
  '07': 'disapprove', '08': 'invalid',
};

// === Parse OAPMA XML (simple regex-based, no dependency) ===
function parseOapmaXml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = [];
  // Match <z:row ... /> patterns
  const rowRegex = /<z:row\s+([^>]+?)\/>/g;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const attrs = {};
    const attrRegex = /(\w+)='([^']*)'/g;
    let am;
    while ((am = attrRegex.exec(match[1])) !== null) {
      attrs[am[1]] = am[2].trim();
    }
    rows.push(attrs);
  }
  return rows;
}

// === Parse typekey_map.yaml into structured blocks ===
function parseTypekeyMap(yamlPath) {
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const blocks = [];
  const rawBlocks = content.split(/^- type_key: /m).slice(1);
  
  for (const raw of rawBlocks) {
    const tk = raw.split('\n')[0].trim();
    const services = {};
    const servicesByName = {};
    
    for (const m of raw.matchAll(/^    (\w+): (yf\.oapi\.\S+)$/gm)) {
      services[m[1]] = m[2];
    }
    for (const m of raw.matchAll(/^    (yf\.oapi\.\S+): (\w+)$/gm)) {
      servicesByName[m[1]] = m[2];
    }
    
    const titleMatch = raw.match(/^  title: (.+)$/m);
    const pkMatch = raw.match(/^  primary_key: \[(.*?)\]/m);
    const dnMatch = raw.match(/^  detail_nodes: \[(.*?)\]$/m);
    const opsMatch = raw.match(/^  operations: \[(.*?)\]$/m);
    
    blocks.push({
      type_key: tk,
      title: titleMatch ? titleMatch[1].trim() : '',
      services,
      servicesByName,
      primary_key: pkMatch ? pkMatch[1].split(',').map(s => s.trim()) : [],
      detail_nodes: dnMatch ? dnMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [],
      operations: opsMatch ? opsMatch[1].split(',').map(s => s.trim()) : [],
      raw,
    });
  }
  return { blocks, content };
}

// === Infer type_key from service name ===
function inferTypeKey(svc) {
  // yf.oapi.{type_key}.data.{op}.get → type_key
  let m = svc.match(/^yf\.oapi\.(.+?)\.data\.\w+\.get$/);
  if (m) return m[1];
  // yf.oapi.{type_key}.{op}.get → type_key
  m = svc.match(/^yf\.oapi\.(.+?)\.\w+\.get$/);
  if (m) return m[1];
  // yf.oapi.{type_key}.data.{op} → type_key
  m = svc.match(/^yf\.oapi\.(.+?)\.data\.\w+$/);
  if (m) return m[1];
  // yf.oapi.{type_key}.{op} → type_key
  m = svc.match(/^yf\.oapi\.(.+?)\.\w+$/);
  if (m) return m[1];
  return null;
}

// === Main ===
console.log('='.repeat(80));
console.log('patch-typekey-from-oapma.mjs — 从 OAPMA 补充 typekey_map');
console.log(CHECK_ONLY ? '模式：--check（仅检查，不写盘）' : '模式：执行补丁');
console.log('='.repeat(80));

// 1. Parse OAPMA
const oapmaRows = parseOapmaXml(OAPMA_PATH);
console.log(`\nOAPMA 服务数: ${oapmaRows.length}`);

// Build OAPMA index: svc → { op_name, node_code, description, dev_status }
const oapmaIndex = {};
for (const row of oapmaRows) {
  const svc = row.MA001;
  if (!svc) continue;
  const opName = OP_MAP[row.MA003];
  if (!opName) continue; // skip unknown ops (09/10)
  oapmaIndex[svc] = {
    op_name: opName,
    node_code: row.MA005 || '',
    description: row.MA008 || '',
    dev_status: row.MA024 || '',
  };
}

// 2. Parse typekey_map
const { blocks, content: yamlContent } = parseTypekeyMap(YAML_PATH);
const tkMap = new Map(blocks.map(b => [b.type_key, b]));

// Collect all known services
const knownServices = new Set();
for (const b of blocks) {
  for (const svc of Object.values(b.services)) knownServices.add(svc);
  for (const svc of Object.keys(b.servicesByName)) knownServices.add(svc);
}

// 3. Find missing services
const patches = []; // { type_key, op_name, service, node_code, description, is_new_tk }

for (const [svc, info] of Object.entries(oapmaIndex)) {
  if (knownServices.has(svc)) continue;
  if (svc.startsWith('yf.ai.')) continue;
  if (svc.includes('.222.')) continue;
  // 跳过已知异常：wo.routing.data.all 不是合法 type_key
  if (svc.includes('.data.all.')) continue;
  // 跳过已知异常：wo.routing.data.all 不是合法 type_key
  if (svc.includes('.data.all.')) continue;
  
  const tk = inferTypeKey(svc);
  if (!tk) continue;
  
  const existing = tkMap.get(tk);
  patches.push({
    type_key: tk,
    op_name: info.op_name,
    service: svc,
    node_code: info.node_code,
    description: info.description,
    dev_status: info.dev_status,
    is_new_tk: !existing,
  });
}

console.log(`\n需补充的服务: ${patches.length}`);

// Group by type_key
const byTk = {};
for (const p of patches) {
  if (!byTk[p.type_key]) byTk[p.type_key] = [];
  byTk[p.type_key].push(p);
}

// 过滤：如果已有同操作的服务（.data 版本），移除不带 .data 的重复
for (const [tk, ps] of Object.entries(byTk)) {
  const existing = tkMap.get(tk);
  if (existing) {
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      if (!p.service.includes('.data.') && existing.services[p.op_name]) {
        console.log(`  跳过重复: ${p.service} (已有 ${existing.services[p.op_name]})`);
        ps.splice(i, 1);
      }
    }
  }
}
// 移除空组
for (const tk of Object.keys(byTk)) {
  if (byTk[tk].length === 0) delete byTk[tk];
}

for (const [tk, ps] of Object.entries(byTk).sort()) {
  const existing = tkMap.get(tk);
  const tag = existing ? '补充操作' : '★ 新增对象';
  console.log(`\n  ${tk} [${tag}]`);
  for (const p of ps) {
    console.log(`    + ${p.op_name}: ${p.service}  (node=${p.node_code}, status=${p.dev_status})`);
  }
}

if (patches.length === 0) {
  console.log('\n无需补充，typekey_map 已与 OAPMA 一致。');
  process.exit(0);
}

if (CHECK_ONLY) {
  console.log(`\n[CHECK] 发现 ${patches.length} 个缺失服务，未写盘。`);
  process.exit(0);
}

// 4. Apply patches to YAML
let newYaml = yamlContent;

for (const [tk, ps] of Object.entries(byTk)) {
  const existing = tkMap.get(tk);
  
  if (existing) {
    // Append services to existing block
    // Find the block in YAML and insert new services
    const blockStart = newYaml.indexOf(`- type_key: ${tk}\n`);
    if (blockStart === -1) {
      console.error(`ERROR: Cannot find type_key: ${tk} in YAML`);
      continue;
    }
    
    // Find the end of this block (next "- type_key:" or EOF)
    const nextBlock = newYaml.indexOf('\n- type_key: ', blockStart + 1);
    const blockEnd = nextBlock === -1 ? newYaml.length : nextBlock;
    let block = newYaml.substring(blockStart, blockEnd);
    
    // Add to services_by_name section
    for (const p of ps) {
      const sbnLine = `    ${p.service}: ${p.op_name}`;
      if (!block.includes(sbnLine)) {
        // Insert before "  services:" line
        block = block.replace(
          /^  services:\n/m,
          `${sbnLine}\n  services:\n`
        );
      }
    }
    
    // Add to services section
    for (const p of ps) {
      const svcLine = `    ${p.op_name}: ${p.service}`;
      if (!block.includes(svcLine)) {
        // Insert before "  operations:" line
        block = block.replace(
          /^  operations:/m,
          `${svcLine}\n  operations:`
        );
      }
    }
    
    // Update operations list
    const allOps = [...existing.operations, ...ps.map(p => p.op_name)].sort();
    const uniqueOps = [...new Set(allOps)];
    block = block.replace(
      /^  operations: \[.*?\]$/m,
      `  operations: [${uniqueOps.join(', ')}]`
    );
    
    // Update aliases
    const newAliases = ps.map(p => p.service);
    const aliasMatch = block.match(/^  aliases: \[(.*?)\]$/m);
    if (aliasMatch) {
      const currentAliases = aliasMatch[1];
      const updatedAliases = `${currentAliases}, ${newAliases.join(', ')}`;
      block = block.replace(
        /^  aliases: \[.*?\]$/m,
        `  aliases: [${updatedAliases}]`
      );
    }
    
    // Add supplement marker
    if (!block.includes('oapma_supplement')) {
      block = block.replace(
        /\n(- type_key: |$)/,
        `\n  oapma_supplemented: true   # 部分服务由 OAPMA 补充（scripts/patch-typekey-from-oapma.mjs）\n$1`
      );
    }
    
    newYaml = newYaml.substring(0, blockStart) + block + newYaml.substring(blockEnd);
    
  } else {
    // Create new type_key block
    // Insert before the last block's end (alphabetically would be ideal, but append is simpler)
    const svcs = ps.reduce((acc, p) => { acc[p.op_name] = p.service; return acc; }, {});
    const ops = [...new Set(ps.map(p => p.op_name))].sort();
    const aliases = [tk, ...ps.map(p => p.service)];
    const nc = ps[0].node_code;
    const desc = ps[0].description;
    
    const newBlock = [
      `- type_key: ${tk}`,
      `  title: ${desc || tk}`,
      `  aliases: [${aliases.join(', ')}]`,
      `  services_by_name:`,
      ...ps.map(p => `    ${p.service}: ${p.op_name}`),
      `  services:`,
      ...ops.map(op => `    ${op}: ${svcs[op]}`),
      `  operations: [${ops.join(', ')}]`,
      `  primary_key: []   # 待真机探测或 OAPMB 确认`,
      `  oapma_node_code: ${nc}`,
      `  oapma_supplemented: true   # 整个对象由 OAPMA 补充（scripts/patch-typekey-from-oapma.mjs）`,
      '',
    ].join('\n');
    
    // Append at end
    newYaml = newYaml.trimEnd() + '\n' + newBlock;
  }
}

// 5. Write
fs.writeFileSync(YAML_PATH, newYaml, 'utf-8');
console.log(`\n✅ 已写入 ${YAML_PATH}`);
console.log(`   补充了 ${patches.length} 个服务到 ${Object.keys(byTk).length} 个 type_key`);

// 6. Verify
const verifyBlocks = parseTypekeyMap(YAML_PATH);
const verifyServices = new Set();
for (const b of verifyBlocks.blocks) {
  for (const svc of Object.values(b.services)) verifyServices.add(svc);
}
// 只验证实际写入的（排除被跳过的重复）
const writtenPatches = patches.filter(p => {
  const tk = inferTypeKey(p.service);
  if (!tk) return false;
  const existing = tkMap.get(tk);
  if (existing && !p.service.includes('.data.') && existing.services[p.op_name] && existing.services[p.op_name].includes('.data.')) {
    return false; // 被跳过的重复
  }
  if (p.service.includes('.data.all.')) return false; // 异常服务名
  return true;
});
const stillMissing = writtenPatches.filter(p => !verifyServices.has(p.service));
if (stillMissing.length > 0) {
  console.error(`\n❌ 验证失败：${stillMissing.length} 个服务仍未找到`);
  for (const s of stillMissing) console.error(`   ${s.service}`);
  process.exit(1);
} else {
  console.log(`\n✅ 验证通过：${patches.length} 个服务全部已写入`);
}
