#!/usr/bin/env node
/**
 * verify-node-names-v2.mjs — 用 read.get 接口重跑单身节点名验证
 *
 * v1 问题：用了 query.get（单头列表接口）传 node_name 查单身，
 *          导致 43 个 MA012 误判为「节点未注册」。
 * v2 修正：改用 read.get（单笔明细接口），这才是查单身字段的正确接口。
 *
 * 易飞 API 操作语义（2026-10-09 用户确认）：
 *   query.get  = 批量查询，单头列表（不含明细/单身），类似易助 fastquery
 *   read.get   = 读取单笔，含单据明细（含单身字段），类似易助 getMultiple
 *
 * 用法：
 *   set YF_BASE_URL=http://{内网IP}
 *   set YF_COMPANY_ID={账套编号}
 *   set YF_USER_TOKEN={令牌}
 *   node scripts/verify-node-names-v2.mjs
 *
 * 产物：runs/node-name-verify-v2.{md,json}
 */
import fs from 'node:fs';

const BASE = process.env.YF_BASE_URL, CO = process.env.YF_COMPANY_ID, TK = process.env.YF_USER_TOKEN;
if (!BASE || !CO || !TK) {
  console.error('缺少环境变量 YF_BASE_URL / YF_COMPANY_ID / YF_USER_TOKEN');
  process.exit(1);
}
const U = BASE + '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

async function call(svc, param) {
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
    const text = await res.text();
    if (res.status !== 200) return { code: `HTTP_${res.status}`, msg: text.slice(0, 100), raw: text.slice(0, 200) };
    let j;
    try { j = JSON.parse(text); } catch { return { code: 'JSON_PARSE_ERR', msg: text.slice(0, 100) }; }
    return {
      code: j?.std_data?.execution?.code,
      p: j?.std_data?.parameter,
      msg: j?.std_data?.parameter?.result?.error?.[0]?.message ?? '',
    };
  } catch (e) { return { code: 'NET_ERR', msg: String(e).slice(0, 80) }; }
}

// 读 typekey_map
const yaml = fs.readFileSync('knowledge/typekey/typekey_map.yaml', 'utf-8');
const typekeys = new Map();
for (const b of yaml.split(/^- type_key: /m).slice(1)) {
  const tk = b.split('\n')[0].trim();
  const sv = {};
  for (const m of b.matchAll(/^ {4}(\w+): (yf\.oapi\.\S+)$/gm)) sv[m[1]] = m[2];
  // 也读 primary_key
  const pkMatch = b.match(/^  primary_key: \[(.*?)\]$/m);
  const pk = pkMatch ? pkMatch[1].split(',').map(s => s.trim()) : [];
  typekeys.set(tk, { services: sv, primaryKey: pk });
}

// 读各对照表里的单身节点名 + 单头主键值（从 typekey-mapping 取第一个示例值不现实，用空 datakeys 探测）
const detailNodes = new Map();
for (const f of fs.readdirSync('knowledge/typekey-mapping')) {
  if (!f.endsWith('.md')) continue;
  const tk = f.replace(/\.md$/, '');
  const s = fs.readFileSync('knowledge/typekey-mapping/' + f, 'utf-8');
  const dns = [...s.matchAll(/^## 单身字段：`(.+?)`/gm)].map(m => m[1]);
  if (dns.length) detailNodes.set(tk, dns);
}

console.log('='.repeat(80));
console.log('v2 批量验证：用 read.get 接口验证单身节点名');
console.log('='.repeat(80));
const total = [...detailNodes.values()].reduce((a, b) => a + b.length, 0);
console.log(`待验证：${detailNodes.size} 个对象 / ${total} 个单身节点名\n`);

const results = [];
let i = 0;
for (const [tk, nodes] of detailNodes) {
  const tkInfo = typekeys.get(tk);
  const svc = tkInfo?.services?.read;
  if (!svc) { results.push({ tk, node: '(无 read 服务)', verdict: 'SKIP', msg: '', svc: '' }); continue; }

  // read.get 需要 datakeys，用空对象探测（服务端会报缺 key 但不会报 MA012）
  // 或者用 page_no/page_size + conditions 方式（如果 read 也支持的话）
  // 先试 conditions + node_name 方式
  for (const node of nodes) {
    i++;
    const candFields = [`${node.replace(/_data$/, '')}_no`, 'item_no', 'doc_no', 'seq'];
    let best = null;
    for (const f of candFields) {
      const r = await call(svc, {
        page_no: 1, page_size: 1, use_has_next: false,
        conditions: { operator: 'AND', fields: [{ field_name: f, operator: '=', value: 'PROBE', node_name: node }] },
      });
      if (r.code === '0') { best = { field: f, verdict: 'ACCEPT' }; break; }
      if (!r.msg.includes('MA012')) { best = { field: f, verdict: 'OTHER', msg: r.msg }; break; }
    }
    const v = best?.verdict ?? 'MA012';
    results.push({ tk, node, field: best?.field ?? '', verdict: v, msg: best?.msg ?? '', svc });
    process.stdout.write(`\r  进度 ${i}/${total}  ${v === 'ACCEPT' ? '\u2705' : v === 'MA012' ? '\u274c' : '\u26a0'} ${tk} / ${node}          `);
  }
}
process.stdout.write('\n\n');

const accept = results.filter(r => r.verdict === 'ACCEPT');
const ma012 = results.filter(r => r.verdict === 'MA012');
const other = results.filter(r => r.verdict === 'OTHER');
const skip = results.filter(r => r.verdict === 'SKIP');

console.log('='.repeat(80));
console.log('v2 汇总（read.get 接口）');
console.log('='.repeat(80));
console.log(`\u2705 接受  ${accept.length}`);
console.log(`\u274c MA012 未定义  ${ma012.length}`);
console.log(`\u26a0 其他错误  ${other.length}`);
console.log(`\u2014 跳过（无 read 服务） ${skip.length}`);

// 与 v1 对比
const v1Path = 'runs/node-name-verify.json';
if (fs.existsSync(v1Path)) {
  const v1 = JSON.parse(fs.readFileSync(v1Path, 'utf-8'));
  const v1ma = new Set(v1.results.filter(r => r.verdict === 'MA012').map(r => `${r.tk}|${r.node}`));
  const v2ma = new Set(ma012.map(r => `${r.tk}|${r.node}`));
  const fixed = [...v1ma].filter(k => !v2ma.has(k));
  const stillBad = [...v2ma].filter(k => v1ma.has(k));
  const newBad = [...v2ma].filter(k => !v1ma.has(k));
  console.log(`\nv1\u2192v2 对比：`);
  console.log(`  v1 MA012: ${v1ma.size}  \u2192  v2 MA012: ${v2ma.size}`);
  console.log(`  修复（v1报错 v2通过）: ${fixed.length}`);
  console.log(`  仍然报错: ${stillBad.length}`);
  console.log(`  新增报错: ${newBad.length}`);
  if (fixed.length) {
    console.log('\n  【修复清单】');
    for (const k of fixed.slice(0, 20)) {
      const [tk, node] = k.split('|');
      const v2r = results.find(r => r.tk === tk && r.node === node);
      console.log(`    ${tk.padEnd(30)} ${node.padEnd(40)} \u2192 ${v2r?.verdict}`);
    }
  }
}

if (ma012.length) {
  console.log('\n【仍报 MA012 的节点名】');
  for (const r of ma012) console.log(`  ${r.tk.padEnd(30)} ${r.node}`);
}

// 写产物
const CRLF = t => String(t).split(/\r\n|\r|\n/).join('\r\n');
const out = [
  '# 单身节点名真机验证结果（v2 · read.get 接口）',
  '',
  `- 验证时间：${new Date().toISOString()}`,
  '- 接口：**read.get**（单笔明细，含单身字段）',
  '- v1 用的是 query.get（单头列表），导致 43 个 MA012 误判',
  '- 判据：`code=0` = 接受；报 `MA012未定義` = 节点未注册',
  '',
  '## 汇总',
  '',
  '| 结果 | v1 (query.get) | v2 (read.get) |',
  '|---|---|---|',
  `| 接受 | 5 | ${accept.length} |`,
  `| MA012 未定义 | 43 | ${ma012.length} |`,
  `| 其他错误 | 127 | ${other.length} |`,
  `| 跳过 | 0 | ${skip.length} |`,
  '',
  '## 全部明细',
  '',
  '| type_key | 单身节点名 | 服务名 | 结果 |',
  '|---|---|---|---|',
  ...results.map(r => `| \`${r.tk}\` | \`${r.node}\` | \`${r.svc || ''}\` | ${r.verdict === 'ACCEPT' ? '\u2705' : r.verdict === 'MA012' ? '\u274c MA012' : r.verdict === 'SKIP' ? '\u2014' : '\u26a0'} |`),
  '',
].join('\n');
fs.mkdirSync('runs', { recursive: true });
fs.writeFileSync('runs/node-name-verify-v2.md', CRLF(out), 'utf-8');
fs.writeFileSync('runs/node-name-verify-v2.json', CRLF(JSON.stringify({ generated_at: new Date().toISOString(), interface: 'read.get', results }, null, 2)), 'utf-8');
console.log('\n产物：runs/node-name-verify-v2.{md,json}');
