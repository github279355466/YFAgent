#!/usr/bin/env node
/**
 * extract-typekey-map.mjs — 从Apipost 导出文件抽取易飞(E10) TypeKey 映射表
 *
 * 输入：docs/易飞OpenAPI.json（Apipost 导出，约 48MB）
 * 输出：knowledge/typekey/typekey_map.yaml
 *       knowledge/typekey/_report.json（抽取质量报告）
 *
 * 设计要点：
 *  1. 真实服务名在公共头 digi-service 的 JSON 值里，目录名只是中文标签 → 以 header 为权威
 *  2. 目录名含大量噪声（-OK / -范例 / 测试目录 / 人名 / 同名重复）→ 仅作 title 参考，按服务名去重
 *  3. read.get 的 datakeys 即业务主键 → 机械抽取，实测 292/292 成功
 *  4. 服务名有两种形态（带 .data 段与不带）→ 解析器必须兼容
 *  5. 全部产出带溯源标记，禁止手工编辑（对齐易助 extract-analysis-metadata.mjs 约定）
 *
 * 用法：
 *   node scripts/extract-typekey-map.mjs                # 生成
 *   node scripts/extract-typekey-map.mjs --check        # 只校验不写盘（CI 门禁）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'docs', '易飞OpenAPI.json');
const OUT_DIR = path.join(ROOT, 'knowledge', 'typekey');
const OUT_YAML = path.join(OUT_DIR, 'typekey_map.yaml');
const OUT_REPORT = path.join(OUT_DIR, '_report.json');

const CHECK_ONLY = process.argv.includes('--check');
const PRODUCT_LINE = 'yifei';
const SERVICE_PREFIX = 'yf.';

// ---------------------------------------------------------------- 工具

/** JSONC → JSON（Apipost raw 含 // 注释，需剥离） */
function parseJsonc(raw) {
  if (!raw || !raw.trim()) return null;
  let s = raw;
  // 剥离行注释，但不误伤 URL 中的 //
  s = s.replace(/(:\s*)"([^"]*?)"\s*\/\/[^\n]*/g, '$1"$2"');
  s = s.replace(/^\s*\/\/[^\n]*/gm, '');
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** 提取公共头 digi-service 中的真实服务名 */
function extractServiceName(api) {
  const h = api?.request?.header;
  const list = Array.isArray(h?.parameter) ? h.parameter : [];
  for (const p of list) {
    if (p?.key === 'digi-service') {
      const m = String(p.value ?? '').match(/yf\.oapi\.[a-z0-9._]+/i);
      if (m) return m[0];
    }
  }
  return null;
}

/** 遍历 apis 树，收集所有叶子节点（带完整路径） */
function collectLeaves(apis, trail = []) {
  const out = [];
  for (const it of apis ?? []) {
    const name = String(it?.name ?? '');
    const next = [...trail, name];
    const kids = Array.isArray(it?.apis) ? it.apis : [];
    if (kids.length) out.push(...collectLeaves(kids, next));
    else out.push({ path: next, api: it, title: name });
  }
  return out;
}

/** 目录名降噪：剥离编号前缀与状态后缀，提取中文标题 */
function cleanTitle(rawTitle, serviceName) {
  let t = String(rawTitle ?? '').trim();
  // 找目录中任意一段作为候选：优先含中文的那段
  const parts = t.split('/').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    // 剥离形如 COPI01- / CMSI02- / MOCI02- / QMSI07- / BOMMQ_001 的编号前缀
    let c = p.replace(/^[A-Z]{3,6}\d{0,3}[-_ ]*/, '');
    // 剥离 -OK / -完成 / -范例 / -自己测试 等状态后缀
    c = c.replace(/[-_ ]*(OK|完成|范例|自己测试|测试)$/i, '');
    c = c.replace(/[-_ ]*$/, '').trim();
    if (/[一-龥]/.test(c) && c.length >= 2) return c;
  }
  // 回退：服务名末段
  const seg = String(serviceName ?? '').split('.').filter(Boolean);
  return seg[2] ?? t ?? '';
}

/** 解析服务名 → { obj, op }；兼容带/不带 .data 段 */
function parseServiceName(svc) {
  const body = String(svc).replace(/^yf\.oapi\./, '');
  if (!body) return null;
  // 操作段：固定 8 种；query/read 必带 .get
  const opMatch = body.match(
    /\.(query|read|create|update|delete|approve|disapprove|invalid)(\.get)?$/,
  );
  if (!opMatch) return null;
  const op = opMatch[1];
  const suffix = opMatch[2] ?? '';
  let obj = body.slice(0, opMatch.index);
  if (obj.endsWith('.data')) obj = obj.slice(0, -'.data'.length);
  return { obj, op, suffix };
}

/** 从 read.get 的 datakeys 抽业务主键 */
function extractPrimaryKeys(api) {
  const raw = api?.request?.body?.raw ?? '';
  const j = parseJsonc(raw);
  const dk = j?.std_data?.parameter?.datakeys;
  if (Array.isArray(dk) && dk.length && typeof dk[0] === 'object') {
    return Object.keys(dk[0]);
  }
  return [];
}

/** 从 raw_parameter 抽字段元信息（description / type / not_null） */
function extractFields(api, side) {
  const arr =
    side === 'req'
      ? api?.request?.body?.raw_parameter
      : api?.response?.example?.[0]?.raw_parameter;
  if (!Array.isArray(arr)) return [];
  const prefix = side === 'req' ? 'std_data.parameter' : 'std_data';
  const fields = new Map();
  for (const p of arr) {
    const k = String(p?.key ?? '');
    if (!k.startsWith(prefix)) continue;
    const last = k.split('.').pop();
    if (!last || last === 'std_data' || last === 'parameter') continue;
    // 跳过容器节点（Array/Object 类型且以 _data / datakeys / rows 结尾）
    if (p?.field_type === 'Array' || p?.field_type === 'Object') {
      if (!fields.has(last)) {
        fields.set(last, { node: last, type: p.field_type, desc: p.description ?? '', required: false });
      }
      continue;
    }
    fields.set(last, {
      node: last,
      type: p?.field_type ?? p?.schema?.type ?? 'string',
      desc: String(p?.description ?? '').replace(/\s+/g, ' ').trim(),
      required: p?.not_null === 1,
    });
  }
  return [...fields.values()];
}

/** YAML 标量转义 */
function yScalar(v) {
  if (v === null || v === undefined) return '~';
  const s = String(v);
  if (s === '') return "''";
  if (/^[\d.+-]+$/.test(s) && !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // 纯数字需加引号，避免被解析成数字
    return `'${s}'`;
  }
  if (/[:#{}\[\],&*?|>'"%@`]|^\s|\s$|^(true|false|null|yes|no|on|off)$/i.test(s)) {
    return `'${s.replace(/'/g, "''")}'`;
  }
  return s;
}

// ---------------------------------------------------------------- 主流程

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[FATAL] 源文件不存在：${SRC}`);
    process.exit(1);
  }

  console.log(`[1/6] 读取源文件：${path.relative(ROOT, SRC)}`);
  const stat = fs.statSync(SRC);
  console.log(`      大小 ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
  const doc = JSON.parse(fs.readFileSync(SRC, 'utf-8'));

  console.log(`[2/6] 遍历 apis 树…`);
  const leaves = collectLeaves(doc.apis);
  console.log(`      叶子节点 ${leaves.length} 个`);

  console.log(`[3/6] 解析服务名与操作矩阵…`);
  /** @type {Map<string, any>} */
  const byObj = new Map();
  const svcSet = new Set();
  const noService = [];
  const unparsable = [];
  let opCounter = {};
  const titleCandidates = new Map(); // obj -> Set(中文标题)

  for (const leaf of leaves) {
    const svc = extractServiceName(leaf.api);
    if (!svc) {
      noService.push(leaf.path.join('/'));
      continue;
    }
    svcSet.add(svc);
    const parsed = parseServiceName(svc);
    if (!parsed) {
      unparsable.push(svc);
      continue;
    }
    const { obj, op, suffix } = parsed;
    opCounter[op] = (opCounter[op] ?? 0) + 1;

    if (!byObj.has(obj)) {
      byObj.set(obj, {
        type_key: obj,
        title: '',
        titles: new Set(),
        operations: new Set(),
        services: {},
        primary_key: [],
        detail_nodes: new Set(),
        sample_service: svc,
        has_data_segment: svc.includes('.data.'),
      });
    }
    const rec = byObj.get(obj);
    rec.operations.add(op);
    rec.services[op] = svc;
    if (!suffix && op === 'read') rec.services[op] = svc;

    // 主键：read.get 的 datakeys
    if (op === 'read') {
      const pk = extractPrimaryKeys(leaf.api);
      if (pk.length) rec.primary_key = pk;
    }

    // 标题候选
    const t = cleanTitle(leaf.path[0], svc);
    if (t) rec.titles.add(t);

    // 单身/子表节点名（xxx_data 形态），供 analysis 层建SQL 模板参考
    for (const f of extractFields(leaf.api, 'req')) {
      if (/_data$/.test(f.node) && f.node !== 'datakeys') rec.detail_nodes.add(f.node);
    }
  }

  // 标题选取优先级（越高越优先）：
  //   1. 业务对象级中文名（含中文且不含操作动词，如"会计凭证""核价单"）
  //   2. 操作级中文名（去掉操作动词后的残余，如"新增客户信息"→"客户信息"）
  //   3. 去掉操作动词后仍为空的，退回 type_key
  const OP_CN = [
    '撤销审核', '撤审', '审核', '作废', '新增', '查询', '读取', '更新', '删除', '创建',
  ];
  /** 剥离操作动词与噪声后缀，返回干净主体；无有效主体返回 '' */
  const stripOp = (t) => {
    let c = String(t);
    for (const op of OP_CN) c = c.split(op).join('');
    c = c.replace(/[-_ ]*(信息|資料|资料|数据)*$/,'').replace(/^[-_ ]+|[-_ ]+$/g, '');
    // 纯英文/数字/符号残留视为无效
    if (!c || !/[\u4e00-\u9fa5]/.test(c)) return '';
    // 含"create-xxx"/"update-xxx" 这类中英混杂 → 取中文部分
    const cn = c.match(/[\u4e00-\u9fa5]{2,}/);
    return cn ? cn[0] : '';
  };

  for (const rec of byObj.values()) {
    const arr = [...rec.titles].filter(Boolean);
    const withCn = arr.filter((t) => /[\u4e00-\u9fa5]/.test(t));
    // 逐个去操作动词，取最长有效主体（最长=信息最完整）
    const bodies = withCn.map(stripOp).filter(Boolean);
    rec.title = bodies.sort((a, b) => b.length - a.length)[0]
      ?? withCn[0]
      ?? rec.type_key;
    delete rec.titles;
  }

  const objs = [...byObj.values()].sort((a, b) => a.type_key.localeCompare(b.type_key));
  console.log(`      服务名去重 ${svcSet.size} 个`);
  console.log(`      业务对象 ${objs.length} 个`);
  console.log(`      无服务名（文档型节点）${noService.length} 个`);
  console.log(`      命名不规则服务 ${unparsable.length} 个`);

  console.log(`[4/6] 质量统计…`);
  const withPk = objs.filter((o) => o.primary_key.length).length;
  const opMatrix = {};
  for (const o of objs) {
    const key = [...o.operations].sort().join('+');
    opMatrix[key] = (opMatrix[key] ?? 0) + 1;
  }
  const compositePk = objs.filter((o) => o.primary_key.length > 1);
  const noDataSeg = objs.filter((o) => !o.has_data_segment);
  const report = {
    generated_at: new Date().toISOString(),
    source: 'docs/易飞OpenAPI.json',
    source_bytes: stat.size,
    product_line: PRODUCT_LINE,
    service_prefix: SERVICE_PREFIX,
    counts: {
      leaves: leaves.length,
      services_unique: svcSet.size,
      business_objects: objs.length,
      with_primary_key: withPk,
      without_primary_key: objs.length - withPk,
      composite_primary_key: compositePk.length,
      composite_pk_list: compositePk.map((o) => `${o.type_key}: ${o.primary_key.join('+')}`),
      no_data_segment_objects: noDataSeg.length,
      no_data_segment_list: noDataSeg.map((o) => o.type_key),
      doc_only_nodes: noService.length,
      unparsable_services: unparsable,
      op_counter: opCounter,
      op_matrix: opMatrix,
    },
  };

  console.log(`主键可抽：${withPk}/${objs.length}`);
  console.log(`复合主键对象：${compositePk.length} 个`);
  console.log(`操作分布：`, opCounter);

  const yaml = buildYaml(objs, report, doc);
  const yamlPath = CHECK_ONLY ? null : OUT_YAML;

  if (CHECK_ONLY) {
    console.log('[5/6] --check 模式：不写盘');
    if (!fs.existsSync(OUT_YAML)) {
      console.error('[FAIL] typekey_map.yaml 不存在，请先运行生成');
      process.exit(2);
    }
    // 用内容指纹（忽略 generated_at 行）比对，避免行尾/时间戳等非语义变更误报
    const fingerprint = (t) =>
      t
        .split('\n')
        .filter((l) => !/^\s*#?\s*generated_at:/.test(l))
        .join('\n')
        .replace(/\r/g, '');
    const cur = fingerprint(fs.readFileSync(OUT_YAML, 'utf-8'));
    const now = fingerprint(yaml);
    if (cur !== now) {
      console.error('[FAIL] typekey_map.yaml 内容已过期：源文件或抽取逻辑已变更');
      console.error('       修复：node scripts/extract-typekey-map.mjs');
      process.exit(2);
    }
    console.log('[6/6] PASS：产物内容为最新（内容指纹一致）');
    return;
  }

  console.log(`[5/6] 写出：${path.relative(ROOT, OUT_YAML)}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_YAML, yaml, 'utf-8');
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log('[6/6] 完成');
  console.log(`      ${path.relative(ROOT, OUT_YAML)}  ${(Buffer.byteLength(yaml) / 1024).toFixed(1)} KB`);
  console.log(`      ${path.relative(ROOT, OUT_REPORT)}`);
  console.log('');
  console.log('提醒：该文件为机械抽取产物，请勿手工编辑；重新生成请运行本脚本。');
}

function buildYaml(objs, report, doc) {
  const L = [];
  const push = (s = '') => L.push(s);

  push('# 易飞(E10) TypeKey 映射表');
  push('#');
  push('# 由 scripts/extract-typekey-map.mjs 从 docs/易飞OpenAPI.json 机械抽取生成。');
  push('# 请勿手工编辑；重新生成请运行：node scripts/extract-typekey-map.mjs');
  push('#');
  push(`# source: docs/易飞OpenAPI.json (${(report.source_bytes / 1024 / 1024).toFixed(1)} MB)`);
  push(`# generated_at: ${report.generated_at}`);
  push(`# services_unique: ${report.counts.services_unique}`);
  push(`# business_objects: ${report.counts.business_objects}`);
  push('');
  push('version: 1');
  push(`generated_from:`);
  push(`  - docs/易飞OpenAPI.json`);
  push(`  - apipost_project_id: ${doc.project_id ?? 'unknown'}`);
  push(`  - apipost_name: ${doc.name ?? 'unknown'}`);
  push(`generated_at: "${report.generated_at}"`);
  push(`product_line: ${PRODUCT_LINE}`);
  push(`service_prefix: "${SERVICE_PREFIX}"`);
  push(`auth_headers:`);
  push(`  - digi-service`);
  push(`  - digi-user-token`);
  push(`  - digi-datakey`);
  push(`entrypoint: "/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost"`);
  push(`  # 官方标注「注意大小写」，跨平台部署需校验`);
  push(`success_code_rule: "code === '0' || code === '-0'"`);
  push(`  # '0'=成功；'-0'=批量部分成功（易助侧存在，易飞文档未记载但需兼容）`);
  push('');
  push(`# ---- 操作类型统计（来源：digi-service 末段）----`);
  for (const [op, n] of Object.entries(report.counts.op_counter).sort((a, b) => b[1] - a[1])) {
    push(`#   ${op}: ${n}`);
  }
  push(`# ---- 操作组合统计 ----`);
  for (const [combo, n] of Object.entries(report.counts.op_matrix).sort((a, b) => b[1] - a[1])) {
    push(`#   ${combo}: ${n}`);
  }
  push('');
  push('typekeys:');

  for (const o of objs) {
    const ops = [...o.operations].sort();
    const alias = new Set();
    alias.add(o.title);
    alias.add(o.type_key);
    for (const s of Object.values(o.services)) alias.add(String(s).replace(/^yf\.oapi\./, ''));

    push(`- type_key: ${yScalar(o.type_key)}`);
    push(`  title: ${yScalar(o.title)}`);
    push(`  aliases: [${[...alias].map(yScalar).join(', ')}]`);
    push(`  services:`);
    for (const op of ops) {
      push(`    ${op}: ${yScalar(o.services[op])}`);
    }
    push(`  operations: [${ops.join(', ')}]`);
    push(`  primary_key: [${o.primary_key.map(yScalar).join(', ')}]`);
    if (o.primary_key.length > 1) push(`  composite_key: true`);
    if (o.detail_nodes.size) {
      push(`  detail_nodes: [${[...o.detail_nodes].sort().map(yScalar).join(', ')}]`);
    }
    if (!o.has_data_segment) push(`  no_data_segment: true   # 服务名无 .data 段，调用时勿假设其存在`);
    if (!o.primary_key.length) push(`  primary_key_unknown: true   # 文档未给出 datakeys，须真机探测`);
  }

  push('');
  return L.join('\n');
}

main();
