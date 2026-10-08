#!/usr/bin/env node
/**
 * build-node-table-map.mjs — 从真机错误消息反推「逻辑节点名 → 物理表名」映射（v2）
 *
 * 背景（实测确认）：
 *   · node_name 用**逻辑节点名**（*_data），110/175 可用
 *   · 报「找不到資料表:[XXX]」时，**XXX 就是该节点对应的物理表名**
 *   · 报 MA012未定義 时该节点未注册，拿不到物理表名
 *
 * v1 问题：探测字段用固定候选（doc_no/remarks/item_no），命中率低（仅 16/149）。
 * v2 策略：从**字段字典**中查出该对象的真实字段（按「像编号类」排序）作为探测字段，
 *         大幅提高「字段名正确 → 触发找不到資料表 → 拿到物理表名」的概率。
 *
 * 输出：knowledge/data-dictionary/node-table-map.csv
 *   node_name, type_key, physical_table, confidence, evidence
 */
import fs from 'node:fs';

const BASE = process.env.YF_BASE_URL, CO = process.env.YF_COMPANY_ID, TK = process.env.YF_USER_TOKEN;
if (!BASE || !CO || !TK) {
  console.error('[FATAL] 需设置 YF_BASE_URL / YF_COMPANY_ID / YF_USER_TOKEN');
  process.exit(1);
}
const U = BASE + '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

const CRLF = (t) => String(t).split(/\r\n|\r|\n/).join('\r\n');
const MGMT = new Set(['COMPANY', 'CREATOR', 'USR_GROUP', 'CREATE_DATE', 'MODIFIER', 'MODI_DATE', 'FLAG']);

/** 读 typekey_map.yaml */
function parseTypekeyMap(text) {
  const out = new Map();
  for (const b of text.split(/^- type_key: /m).slice(1)) {
    const typeKey = b.split('\n')[0].trim();
    const services = {};
    for (const m of b.matchAll(/^ {4}(\w+): (yf\.oapi\.\S+)$/gm)) services[m[1]] = m[2];
    const detailNodes = [...b.matchAll(/^ {2}detail_nodes: \[(.*?)\]$/gm)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean));
    out.set(typeKey, { services, detailNodes });
  }
  return out;
}

const tkm = parseTypekeyMap(fs.readFileSync('knowledge/typekey/typekey_map.yaml', 'utf-8'));
const fieldsRaw = JSON.parse(fs.readFileSync('.workbuddy/tmp/dict/fields.json', 'utf-8'));

// table -> [{column, cn}]
const byTable = new Map();
for (const f of fieldsRaw) {
  if (MGMT.has(f.column) || f.is_udf) continue;
  if (!byTable.has(f.table)) byTable.set(f.table, []);
  byTable.get(f.table).push({ column: f.column, cn: f.column_cn || '' });
}
console.log('typekey 对象:', tkm.size, '| 字典表:', byTable.size);

async function q(svc, param) {
  try {
    const res = await fetch(U, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'digi-service': JSON.stringify({ name: svc }),
        'digi-user-token': TK,
        'digi-datakey': JSON.stringify({ CompanyId: CO }),
      },
      body: JSON.stringify({ std_data: { parameter: param } }),
    });
    const j = await res.json();
    return { code: j?.std_data?.execution?.code, msg: j?.std_data?.parameter?.result?.error?.[0]?.message ?? '' };
  } catch (e) { return { code: 'NET_ERR', msg: String(e).slice(0, 60) }; }
}

const extractTable = (msg) => {
  const m = msg.match(/找不到資料表:\[([A-Z0-9_]+)\]/);
  return m ? m[1] : null;
};

/** 打分：越像「编号/单号/数量/日期」越优先（这类字段名更易触发字段名校验分支） */
function scoreField(col, cn) {
  let s = 0;
  if (/编号|单号|代号|号码/.test(cn)) s += 10;
  if (/数量|金额|单价|日期|日/.test(cn)) s += 5;
  if (/\d{3}$/.test(col)) s += 2;
  return s;
}

const seen = new Set();
const uniq = [];
for (const [tk, v] of tkm) {
  for (const n of v.detailNodes) {
    if (seen.has(n)) continue;
    seen.add(n);
    uniq.push({ typeKey: tk, node: n });
  }
}
console.log('待映射节点(去重):', uniq.length);

const results = [];
let done = 0;
for (const { typeKey, node } of uniq) {
  const svc = tkm.get(typeKey)?.services?.query;
  if (!svc) {
    results.push({ node, typeKey, table: '', confidence: 'NO_SERVICE', evidence: '无 query 服务' });
    continue;
  }
  const cols = (byTable.get(typeKey) ?? [])
    .map((f) => ({ ...f, s: scoreField(f.column, f.cn) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map((f) => f.column);
  const probes = cols.length ? cols : ['doc_no', 'item_no', 'remarks'];

  let table = null, confidence = 'NONE', evidence = '';
  for (const f of probes) {
    const r = await q(svc, {
      page_no: 1, page_size: 1, use_has_next: false,
      conditions: { operator: 'AND', fields: [{ field_name: f, operator: '=', value: 'PROBE', node_name: node }] },
    });
    const t = extractTable(r.msg);
    if (t) { table = t; confidence = 'HIGH'; evidence = `字段 ${f} → ${r.msg.slice(0, 70)}`; break; }
    if (r.code === '0') { confidence = 'ACCEPTED_NO_TABLE'; evidence = `node_name 有效（字段 ${f} 未报错）`; break; }
    if (r.msg.includes('MA012')) { confidence = 'MA012'; evidence = '节点未注册（MA012未定義）'; break; }
    if (r.msg.includes('Access violation')) { confidence = 'CRASH'; evidence = '服务端 DLL 崩溃'; break; }
    evidence = `字段 ${f}: ${r.msg.slice(0, 60)}`;
  }
  results.push({ node, typeKey, table: table ?? '', confidence, evidence });
  done++;
  process.stdout.write(`\r  进度 ${done}/${uniq.length}  ${confidence.padEnd(20)} ${node.slice(0, 40).padEnd(42)}      `);
}
process.stdout.write('\n\n');

const byConf = {};
for (const r of results) byConf[r.confidence] = (byConf[r.confidence] ?? 0) + 1;
console.log('=== 置信度分布 ===');
for (const [k, v] of Object.entries(byConf).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + k.padEnd(22) + v);
}

const mapped = results.filter((r) => r.table);
console.log('\n成功反推物理表: ' + mapped.length + ' / ' + results.length + '（v1 为 16）');
console.log('\n全部映射:');
for (const r of mapped) {
  console.log('  ' + r.node.padEnd(48) + ' -> ' + r.table.padEnd(8) + ' [' + r.typeKey + ']');
}

const csv = ['node_name,type_key,physical_table,confidence,evidence'];
for (const r of results) {
  csv.push([r.node, r.typeKey, r.table, r.confidence, `"${(r.evidence ?? '').replace(/"/g, '""')}"`].join(','));
}
fs.mkdirSync('knowledge/data-dictionary', { recursive: true });
fs.writeFileSync('knowledge/data-dictionary/node-table-map.csv', CRLF(csv.join('\n')) + '\n', 'utf-8');
fs.writeFileSync('runs/node-table-map.json', CRLF(JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2)), 'utf-8');
console.log('\n产出: knowledge/data-dictionary/node-table-map.csv');
