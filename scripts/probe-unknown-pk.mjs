/**
 * probe-unknown-pk.mjs — 探测未知主键对象的真实主键
 *
 * 用途：typekey_map.yaml 中 primary_key 为空的对象（无 read.get 服务，
 *       文档里没有 datakeys 可抄），通过「query 第一行 + 唯一性过滤」反推主键。
 *
 * 判定逻辑：
 *   1. query 空条件取全量 → 无数据则无法反推（需换账套或造数）
 *   2. 排除管理字段（company/creator/...）与 udf* 字段（udf 全为 0，无区分度）
 *   3. 逐个业务字段做 `= 首行值` 过滤，命中 1 条即候选唯一键
 *   4. 命名后缀 `xxx_no` 是易飞主键的强约定，可直接采信
 *
 * ⚠️ 「候选唯一键」是**当前数据下**的唯一性，不等于业务主键。
 *    正式主键须由易飞规格文档确认，或在有完整数据的账套上验证。
 *
 * 用法：
 *   set YF_BASE_URL=http://{内网IP}
 *   set YF_COMPANY_ID={账套编号}
 *   set YF_USER_TOKEN={令牌}
 *   node scripts/probe-unknown-pk.mjs
 *
 * 2026-10-08 实测结论：
 *   company.detail        -> company_no
 *   employee-> staff_no   （易飞用 staff_ 前缀，非 employee_）
 *   operation             -> routing_no（工艺 = 路线）
 *   document.type.general -> doc_type_no
 *   item.inventory.qty    -> 服务端 DLL 崩溃（OAPComF2.exe Access violation），无法探测
 */
import fs from 'node:fs';

const BASE = process.env.YF_BASE_URL, CO = process.env.YF_COMPANY_ID, TK = process.env.YF_USER_TOKEN;
const U = BASE + '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

async function q(svc, param) {
  const t0 = Date.now();
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
    return { code: j?.std_data?.execution?.code, desc: j?.std_data?.execution?.description, p: j?.std_data?.parameter, ms: Date.now() - t0, j };
  } catch (e) { return { code: 'NET_ERR', desc: String(e).slice(0, 80), p: null, ms: Date.now() - t0, j: null }; }
}

const rowsOf = (r) => r?.p?.result?.rows ?? [];
const errOf = (r) => r?.j?.std_data?.parameter?.result?.error?.[0]?.message ?? '';
const MGMT = new Set(['company', 'creator', 'usr_group', 'create_date', 'modifier', 'modi_date', 'flag']);

// 从 typekey_map.yaml 读真实服务名（只抄不拼 —— 服务名形态不一致，拼接必错）
const yaml = fs.readFileSync('knowledge/typekey/typekey_map.yaml', 'utf-8');
function servicesOf(tk) {
  for (const b of yaml.split(/^- type_key: /m).slice(1)) {
    if (b.split('\n')[0].trim() !== tk) continue;
    const sv = {};
    for (const m of b.matchAll(/^ {4}(\w+): (yf\.oapi\.\S+)$/gm)) sv[m[1]] = m[2];
    return sv;
  }
  return null;
}

const TARGETS = ['company.detail', 'document.type.general', 'employee', 'item.inventory.qty', 'operation'];

console.log('='.repeat(74));
console.log('未知主键对象探测');
console.log('='.repeat(74));

for (const tk of TARGETS) {
  const sv = servicesOf(tk);
  const svc = sv?.query;
  console.log(`\n【${tk}】`);
  if (!svc) { console.log('  ✗ typekey_map 中无 query 服务'); continue; }
  console.log(`  服务名: ${svc}`);

  const all = await q(svc, { page_no: 1, page_size: 3, use_has_next: false, conditions: {} });
  console.log(`  code=${all.code} total=${all.p?.total_result ?? '-'} ${all.ms}ms ${all.desc ?? ''}`);
  if (all.code !== '0') { console.log(`  ✗ ${errOf(all).slice(0, 120)}`); continue; }

  const rows = rowsOf(all);
  if (rows.length === 0) { console.log('  ⚠ 账套无数据，无法反推'); continue; }

  const cols = Object.keys(rows[0]);
  const biz = cols.filter((c) => !MGMT.has(c) && !/^udf/.test(c));
  console.log(`  业务字段 ${biz.length} 个: ${biz.join(', ').slice(0, 200)}`);
  console.log(`  首行: ${JSON.stringify(Object.fromEntries(biz.slice(0, 6).map((k) => [k, rows[0][k]])))}`);

  const single = biz.filter((c) => rows.every((r) => r[c] !== '' && r[c] != null));
  const unique = [];
  for (const c of single) {
    const v = rows[0][c];
    const r = await q(svc, {
      page_no: 1, page_size: 20, use_has_next: false,
      conditions: { operator: 'AND', fields: [{ field_name: c, operator: '=', value: String(v) }] },
    });
    const n = r.p?.total_result ?? 0;
    if (n === 1) unique.push(c);
    console.log(`    ${c.padEnd(28)} = ${String(v).slice(0, 20).padEnd(20)} -> 命中 ${n}${n === 1 ? ' ✅唯一' : ''}`);
  }
  const noLike = unique.filter((c) => /_no$/.test(c));
  console.log(`  ⇒ 唯一键: ${unique.join(' + ') || '(无)'}`);
  if (noLike.length) console.log(`  ⇒ 符合 _no 命名约定（易飞主键强约定）: ${noLike.join(', ')}`);
}

console.log('\n' + '='.repeat(74));
console.log('已知实测结论（2026-10-08）');
console.log('='.repeat(74));
console.log('  company.detail        -> company_no');
console.log('  employee              -> staff_no      （易飞用 staff_ 前缀，非 employee_）');
console.log('  operation             -> routing_no     （工艺 = 路线）');
console.log('  document.type.general -> doc_type_no');
console.log('  item.inventory.qty    -> 服务端 DLL 崩溃（OAPComF2.exe Access violation），无法探测');
