#!/usr/bin/env node
/**
 * verify-node-names.mjs — 批量验证全部单身节点名在真机是否被接受
 *
 * 背景：查询单身字段时 `conditions.fields[].node_name` 必填。
 *       官方文档所举 `sales_order_detail_data` 这类**逻辑节点名**是正确用法（已实测）。
 *       本脚本逐个验证 175 个节点名，识别三类结果：
 *
 *   ·ACCEPT  code=0                → 节点名正确（后续可查字段）
 *   ·OTHER   报错「找不到資料表:[XXX]」→ **节点名正确**，是本脚本猜的字段名不对
 *                                 → 真实字段名须从该节点自己的对照表取
 *   ·MA012   报错「MA012未定義」→ **节点名未在 OAPMA 注册表登记**（需易飞端处理）
 *
 * ⚠️ 重要：`MA012` 与数据库表结构**无关**，是节点注册问题。
 *    报「找不到資料表:[XXX]」时，其中的 XXX 是**该节点对应的物理表名**，
 *    可用于反查逻辑节点 ↔ 物理表的对应关系。
 *
 * 用法：
 *   set YF_BASE_URL=http://{内网IP}
 *   set YF_COMPANY_ID={账套编号}
 *   set YF_USER_TOKEN={令牌}
 *   node scripts/verify-node-names.mjs
 *
 * 产物：runs/node-name-verify.{md,json}（runs/ 已 gitignore）
 * 2026-08-08 实测：175 个中 ACCEPT 5 / OTHER 127（含 105 个字段名猜错）/ MA012 43
 */
import fs from 'node:fs';

const BASE = process.env.YF_BASE_URL, CO = process.env.YF_COMPANY_ID, TK = process.env.YF_USER_TOKEN;
const U = BASE + '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

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
    return {
      code: j?.std_data?.execution?.code,
      p: j?.std_data?.parameter,
      msg: j?.std_data?.parameter?.result?.error?.[0]?.message ?? '',
    };
  } catch (e) { return { code: 'NET_ERR', p: null, msg: String(e).slice(0, 60) }; }
}

// 读 typekey_map
const yaml = fs.readFileSync('knowledge/typekey/typekey_map.yaml', 'utf-8');
const typekeys = new Map();
for (const b of yaml.split(/^- type_key: /m).slice(1)) {
  const tk = b.split('\n')[0].trim();
  const sv = {};
  for (const m of b.matchAll(/^ {4}(\w+): (yf\.oapi\.\S+)$/gm)) sv[m[1]] = m[2];
  const dn = [...b.matchAll(/^  detail_nodes: \[(.*?)\]$/gm)][0]?.[1]
    ?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  typekeys.set(tk, { services: sv, detailNodes: dn });
}

// 读各对照表里的单身节点名
const detailNodes = new Map(); // tk -> [node]
for (const f of fs.readdirSync('knowledge/typekey-mapping')) {
  if (!f.endsWith('.md')) continue;
  const tk = f.replace(/\.md$/, '');
  const s = fs.readFileSync('knowledge/typekey-mapping/' + f, 'utf-8');
  const dns = [...s.matchAll(/^## 单身字段：`(.+?)`/gm)].map((m) => m[1]);
  if (dns.length) detailNodes.set(tk, dns);
}

console.log('='.repeat(80));
console.log('批量验证：全部单身节点名是否被真机接受');
console.log('='.repeat(80));
const total = [...detailNodes.values()].reduce((a, b) => a + b.length, 0);
console.log(`待验证：${detailNodes.size} 个对象 / ${total} 个单身节点名\n`);

const results = [];
let i = 0;
for (const [tk, nodes] of detailNodes) {
  const tkInfo = typekeys.get(tk);
  const svc = tkInfo?.services?.query;
  if (!svc) { results.push({ tk, node: '(无 query 服务)', verdict: 'SKIP', msg: '' }); continue; }
  for (const node of nodes) {
    i++;
    // 逐个候选字段：优先用字段名后缀推断，或用第一个业务字段
    const candFields = [`${node.replace(/_data$/, '')}_no`, 'item_no', 'doc_no', 'seq'];
    let best = null;
    for (const f of candFields) {
      const r = await q(svc, {
        page_no: 1, page_size: 1, use_has_next: false,
        conditions: { operator: 'AND', fields: [{ field_name: f, operator: '=', value: 'PROBE', node_name: node }] },
      });
      if (r.code === '0') { best = { field: f, verdict: 'ACCEPT' }; break; }
      if (!r.msg.includes('MA012')) { best = { field: f, verdict: 'OTHER', msg: r.msg }; break; }
    }
    const v = best?.verdict ?? 'MA012';
    results.push({ tk, node, field: best?.field ?? '', verdict: v, msg: best?.msg ?? '' });
    process.stdout.write(`\r  进度 ${i}/${total}  ${v === 'ACCEPT' ? '✅' : v === 'MA012' ? '❌' : '⚠'} ${tk} / ${node}          `);
  }
}
process.stdout.write('\n\n');

const accept = results.filter((r) => r.verdict === 'ACCEPT');
const ma012 = results.filter((r) => r.verdict === 'MA012');
const other = results.filter((r) => r.verdict === 'OTHER');
const skip = results.filter((r) => r.verdict === 'SKIP');

console.log('='.repeat(80));
console.log('汇总');
console.log('='.repeat(80));
console.log(`✅ 接受  ${accept.length}`);
console.log(`❌ MA012 未定义  ${ma012.length}`);
console.log(`⚠ 其他错误  ${other.length}`);
console.log(`—跳过（无 query 服务） ${skip.length}`);

if (ma012.length) {
  console.log('\n【MA012 未定义的节点名（需易飞端注册）】');
  for (const r of ma012) console.log(`  ${r.tk.padEnd(26)} ${r.node}`);
}
if (other.length) {
  console.log('\n【其他错误】');
  for (const r of other.slice(0, 15)) console.log(`  ${r.tk.padEnd(26)} ${r.node.padEnd(38)} ${r.msg.slice(0, 60)}`);
}
if (skip.length) {
  console.log('\n【跳过（该对象无 query 服务，无法验证）】');
  for (const r of skip) console.log(`  ${r.tk}`);
}

// 写产物
const CRLF = (t) => String(t).split(/\r\n|\r|\n/).join('\r\n');
const out = [
  '# 单身节点名真机验证结果',
  '',
  `- 验证时间：${new Date().toISOString()}`,
  '- 方法：对每个 `*_data` 节点名，构造 `conditions.fields[].node_name` 探测请求',
  '- 判据：`code=0` = 接受；报 `MA012未定義` = 节点未注册',
  '',
  '## 汇总',
  '',
  '| 结果 | 数量 |',
  '|---|---|',
  `| 接受 | ${accept.length} |`,
  `| MA012 未定义 | ${ma012.length} |`,
  `| 其他错误 | ${other.length} |`,
  `| 跳过 | ${skip.length} |`,
  '',
  '## 全部明细',
  '',
  '| type_key | 单身节点名 | 结果 |',
  '|---|---|---|',
  ...results.map((r) => `| \`${r.tk}\` | \`${r.node}\` | ${r.verdict === 'ACCEPT' ? '✅' : r.verdict === 'MA012' ? '❌ MA012' : r.verdict === 'SKIP' ? '—' : '⚠'} |`),
  '',
].join('\n');
fs.mkdirSync('runs', { recursive: true });
fs.writeFileSync('runs/node-name-verify.md', CRLF(out), 'utf-8');
fs.writeFileSync('runs/node-name-verify.json', CRLF(JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2)), 'utf-8');
console.log('\n产物：runs/node-name-verify.{md,json}（runs/ 已 gitignore）');
