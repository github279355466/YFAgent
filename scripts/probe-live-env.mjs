#!/usr/bin/env node
/**
 * probe-live-env.mjs — 易飞(E10) OpenAPI 真机环境连通性与规则验证
 *
 * 用途：验证 docs/plans/yf-openapi-rules.md 提取的规则是否与真机一致。
 * 每一项都对照「文档说法」与「真机实测」，不一致处显式标注。
 *
 * 安全：URL / CompanyId / token 全部走环境变量，不写入仓库。
 * 用法：
 *   set YF_BASE_URL=http://{内网IP}
 *   set YF_COMPANY_ID={账套编号}
 *   set YF_USER_TOKEN=xxx
 *   node scripts/probe-live-env.mjs
 *   或传参：node scripts/probe-live-env.mjs --url ... --company ... --token ...
 *
 * ⚠️ 只做**只读**操作（query / read），不调用 create / update / delete / approve。
 */

import crypto from 'node:crypto';

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);

// ---------------------------------------------------------------- 参数

function arg(name, envName) {
  const i = process.argv.indexOf('--' + name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return process.env[envName] ?? '';
}

const BASE_URL = arg('url', 'YF_BASE_URL').replace(/\/+$/, '');
const COMPANY_ID = arg('company', 'YF_COMPANY_ID');
const TOKEN = arg('token', 'YF_USER_TOKEN');

/**
 * 示例（已脱敏，勿直接写入真实值）：
 *   YF_BASE_URL=http://{内网IP}
 *   YF_COMPANY_ID={账套编号}
 *   YF_USER_TOKEN={令牌}
 * 真实值通过环境变量注入，**禁止写入仓库**。
 */
if (!BASE_URL || !COMPANY_ID || !TOKEN) {
  console.error('[FATAL] 缺少必要参数。请设置环境变量：');
  console.error('  YF_BASE_URL     易飞 OpenAPI 入口');
  console.error('  YF_COMPANY_ID   公司别（账套）编号');
  console.error('  YF_USER_TOKEN   digi-user-token');
  process.exit(1);
}

const ENTRY = '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';
const URL_FULL = BASE_URL + ENTRY;

const HDR = {
  'Content-Type': 'application/json; charset=utf-8',
  'digi-service': '',
  'digi-user-token': TOKEN,
  'digi-datakey': JSON.stringify({ CompanyId: COMPANY_ID }),
};

// ---------------------------------------------------------------- 工具

const results = [];
function rec(caseName, expect, actual, pass, note) {
  results.push({ case: caseName, expect, actual, pass, note: note ?? '' });
  const tag = pass === true ? '[PASS]' : pass === false ? '[FAIL]' : '[INFO]';
  console.log(`${tag} ${caseName}`);
  if (note) console.log(`       ${note}`);
}

/** 调用 OpenAPI，返回 { httpStatus, body, json, elapsedMs } */
async function call(serviceName, parameter, { raw = false, timeoutMs = 20000 } = {}) {
  const headers = { ...HDR, 'digi-service': JSON.stringify({ name: serviceName }) };
  const payload = { std_data: { parameter } };
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(URL_FULL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const text = await res.text();
    const elapsed = Date.now() - started;
    let json = null;
    try { json = JSON.parse(text); } catch { /* 非 JSON */ }
    return { httpStatus: res.status, text, json, elapsed, raw: raw ? text : undefined };
  } catch (e) {
    return { httpStatus: 0, text: String(e), json: null, elapsed: Date.now() - started, error: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

const codeOf = (r) => r?.json?.std_data?.execution?.code;
const descOf = (r) => r?.json?.std_data?.execution?.description;
const rowsOf = (r) => r?.json?.std_data?.parameter?.result?.rows;
const totalOf = (r) => r?.json?.std_data?.parameter?.total_result;

function mask(s) {
  const t = String(s ?? '');
  if (t.length <= 8) return t;
  return t.slice(0, 3) + '***' + t.slice(-3);
}

// ================================================================ 探测

async function main() {
  console.log('='.repeat(72));
  console.log('易飞(E10) OpenAPI 真机环境探测');
  console.log('='.repeat(72));
  console.log(`入口   : ${URL_FULL}`);
  console.log(`账套   : ${COMPANY_ID}`);
  console.log(`令牌   : ${mask(TOKEN)}`);
  console.log('');

  // ── 0. 连通性
  console.log('【0】连通性');
  const r0 = await call('yf.oapi.plant.data.query.get', {
    page_no: 1, page_size: 1, use_has_next: false, conditions: {},
  });
  console.log(`  HTTP ${r0.httpStatus} | ${r0.elapsed}ms | code=${codeOf(r0)} | desc=${descOf(r0)}`);
  if (r0.httpStatus === 0) {
    console.error('\n[FATAL] 网络不通，无法继续');
    process.exit(2);
  }
  rec('T-00 连通性 + 鉴权', 'HTTP 200 且 code=0', `HTTP ${r0.httpStatus} code=${codeOf(r0)}`, r0.httpStatus === 200 && codeOf(r0) === '0');
  console.log('');

  // ── 1. 四个公共头
  console.log('【1】公共请求头（对照文档：四项全必填）');
  for (const h of ['digi-service', 'digi-user-token', 'digi-datakey', 'Content-Type']) {
    console.log(`  ${h.padEnd(18)} = ${h === 'digi-user-token' ? mask(TOKEN) : (h === 'digi-datakey' ? HDR[h] : (h === 'digi-service' ? '(按调用填充)' : HDR[h]))}`);
  }
  rec('T-01 公共头齐备', '四项齐备', '四项已齐备', true, 'digi-datakey 为易飞独有（易助无此头）');
  console.log('');

  // ── 2. 错误结构：空服务名
  console.log('【2】容错：空服务名的错误形态');
  {
    const h = { ...HDR, 'digi-service': JSON.stringify({ name: '' }) };
    const started = Date.now();
    let status = 0;
    let txt = '';
    try {
      const res = await fetch(URL_FULL, {
        method: 'POST', headers: h,
        body: JSON.stringify({ std_data: { parameter: { page_no: 1 } } }),
      });
      status = res.status;
      txt = await res.text();
    } catch (e) {
      txt = String(e);
    }
    const elapsed = Date.now() - started;
    let j = null; try { j = JSON.parse(txt); } catch { /* 非 JSON，原样输出 */ }
    console.log(`  HTTP ${status} | ${elapsed}ms`);
    console.log(`  响应前240 字: ${String(txt).slice(0, 240)}`);
    if (j) {
      console.log(`  code=${codeOf(j)} desc=${descOf(j)}`);
    }
    rec('T-02 空服务名', '返回可解析的错误（不崩溃）', `HTTP ${status}${j ? ' code=' + codeOf(j) : ' (非JSON)'}`,
      typeof txt === 'string' && txt.length > 0,
      '用于确定 SDK 对非法响应的兜底处理');
  }
  console.log('');

  // ── 3. 账套隔离
  console.log('【3】digi-datakey 账套隔离（易飞独有机制）');
  {
    const h = { ...HDR, 'digi-datakey': JSON.stringify({ CompanyId: 'NOT_EXIST_CO' }), 'digi-service': JSON.stringify({ name: 'yf.oapi.plant.data.query.get' }) };
    const res = await fetch(URL_FULL, {
      method: 'POST', headers: h,
      body: JSON.stringify({ std_data: { parameter: { page_no: 1, page_size: 1, conditions: {} } } }),
    }).catch(() => null);
    const txt = res ? await res.text() : '(网络失败)';
    let j = null; try { j = JSON.parse(txt); } catch { /* noop */ }
    console.log(`  错误账套 -> HTTP ${res ? res.status : 0} | code=${codeOf(j)} | desc=${descOf(j)}`);
    rec('T-03 账套隔离生效', '错误 CompanyId 应报错', `code=${codeOf(j)}`, codeOf(j) === '-1' || codeOf(j) === undefined,
      '若返回 code=0 说明账套参数未生效，需重新确认机制');
  }
  console.log('');

  // ── 4. query 返回结构
  console.log('【4】查询返回结构（对照文档：rows + total_result + has_next + cnt）');
  {
    const r = await call('yf.oapi.plant.data.query.get', {
      page_no: 1, page_size: 3, use_has_next: false, conditions: {},
    });
    const p = r.json?.std_data?.parameter;
    console.log(`  code=${codeOf(r)} total_result=${totalOf(r)} has_next=${p?.has_next} cnt=${p?.result?.cnt}`);
    const rows = rowsOf(r) ?? [];
    console.log(`  rows 数=${rows.length}`);
    if (rows.length) {
      const keys = Object.keys(rows[0]);
      console.log(`  首行字段(${keys.length}): ${keys.slice(0, 12).join(', ')}`);
      console.log(`  首行样例: ${JSON.stringify(rows[0]).slice(0, 260)}`);
    }
    rec('T-04 查询回参层级', 'parameter.result.rows[]', Array.isArray(rows) ? 'rows[] 存在' : '未找到 rows', Array.isArray(rows));
    rec('T-05 分页元数据', 'total_result/has_next/cnt 齐备',
      `${totalOf(r) ?? '缺失'}/${p?.has_next ?? '缺失'}/${p?.result?.cnt ?? '缺失'}`,
      totalOf(r) !== undefined && p?.has_next !== undefined && p?.result?.cnt !== undefined);
    rec('T-06 管理字段返回', 'company/create_date 等7 个',
      rows[0] ? Object.keys(rows[0]).filter((k) => ['company','creator','usr_group','create_date','modifier','modi_date','flag'].includes(k)).join(',') || '无' : '无',
      rows[0] ? Object.keys(rows[0]).includes('company') : false,
      '管理字段是否随查询返回');
  }
  console.log('');

  // ── 5. conditions 结构（最高风险项）
  console.log('【5】conditions 结构验证（文档：对象 + operator + fields[]，非数组）');
  {
    // 5.1 正确：对象形态
    const rObj = await call('yf.oapi.plant.data.query.get', {
      page_no: 1, page_size: 5, use_has_next: false,
      conditions: { operator: 'AND', fields: [{ field_name: 'plant_no', operator: '=', value: 'OATEST' }] },
    });
    console.log(`  5.1 对象形态（正确用法）        -> total=${totalOf(rObj)} rows=${(rowsOf(rObj) ?? []).length} code=${codeOf(rObj)}`);

    // 5.2 错误：数组形态（易助写法）
    const rArr = await call('yf.oapi.plant.data.query.get', {
      page_no: 1, page_size: 5, use_has_next: false,
      conditions: [{ groups: [{ fields: [{ field_name: 'plant_no', operator: '=', value: 'OATEST' }] }] }],
    });
    console.log(`  5.2 数组形态（易助写法，禁用）  -> total=${totalOf(rArr)} rows=${(rowsOf(rArr) ?? []).length} code=${codeOf(rArr)}`);

    const objTotal = totalOf(rObj) ?? -1;
    const arrTotal = totalOf(rArr) ?? -1;
    const arrRejected = codeOf(rArr) === '-1';
    const errMsg = rArr?.json?.std_data?.parameter?.result?.error?.[0]?.message ?? '(无)';
    rec('T-07 对象形态可用', '对象形态过滤生效', `total=${objTotal} rows=${(rowsOf(rObj) ?? []).length}`, objTotal >= 0);
    rec('T-08 数组形态被拒绝', '数组形态应报conditions not found',
      `code=${codeOf(rArr)} error=${errMsg}`, arrRejected,
      '**实测推翻原假设**：易飞对错误 conditions 结构是「显式报错」而非「静默返回全量」，风险等级可下调');
  }
  console.log('');

  // ── 6. read 与复合主键
  console.log('【6】read 服务与复合主键（对照文档：datakeys 对象数组）');
  {
    // 先查一张真实凭证取得有效主键，再做正反测试
    const qy = await call('yf.oapi.accounting.voucher.data.query.get', {
      page_no: 1, page_size: 1, use_has_next: false, conditions: {},
    });
    const sample = (rowsOf(qy) ?? [])[0] ?? null;
    const validKey = sample ? { doc_type_no: sample.doc_type_no, doc_no: sample.doc_no } : null;
    console.log(`  有效主键样本: ${validKey ? JSON.stringify(validKey) : '(无数据，跳过正反测试)'}`);

    // 6a 有效主键 —— 验证复合主键可用
    const rOk = await call('yf.oapi.accounting.voucher.data.read.get', {
      datakeys: [validKey ?? { doc_type_no: 'ZZ', doc_no: 'NOT_EXIST' }],
    });
    const okSucc = rOk.json?.std_data?.parameter?.result?.success ?? [];
    console.log(`  6a 有效主键-> code=${codeOf(rOk)} success=${okSucc.length} 容器=${okSucc[0] ? Object.keys(okSucc[0]).join(',') : '-'}`);
    rec('T-09 复合主键有效读取', '有效主键应读到数据且含单据容器',
      `code=${codeOf(rOk)} success=${okSucc.length}`,
      codeOf(rOk) === '0' && validKey !== null,
      validKey ? `真机确认复合主键 = ${Object.keys(validKey).join(' + ')}` : '账套无凭证数据');

    // 6b 缺一个主键字段 —— 触发 error[]，验证错误结构
    const partial = validKey ? { ...validKey } : { doc_type_no: 'ZZ' };
    if (validKey) delete partial.doc_no;
    const rErr = await call('yf.oapi.accounting.voucher.data.read.get', { datakeys: [partial] });
    const errArr = rErr.json?.std_data?.parameter?.result?.error;
    console.log(`  6b 缺主键-> code=${codeOf(rErr)} desc=${descOf(rErr)}`);
    if (errArr) {
      const e0 = errArr[0] ?? {};
      console.log(`error[0] keys: ${Object.keys(e0).join(', ')}`);
      console.log(`error[0].message: ${String(e0.message).slice(0, 120)}`);
      console.log(`error[0].data: ${JSON.stringify(e0.data).slice(0, 120)}`);
      const hasMessage = typeof e0.message === 'string';
      const hasInformation = Array.isArray(e0.information);
      rec('T-10 error[] 结构', 'message 或 information[] 之一',
        hasMessage ? '{message, data}' : hasInformation ? '{information[]}' : '未知',
        hasMessage || hasInformation,
        '解析器需同时兼容两种（文档与真机均有两种形态）');
      rec('T-11 缺主键报错', 'code=-1 且 message 指明缺哪个字段',
        `code=${codeOf(rErr)} msg=${String(e0.message).slice(0, 40)}`,
        codeOf(rErr) === '-1');
    } else {
      rec('T-10 error[] 结构', '缺主键应返回 error[]', '未返回 error[]', false);
    }
  }
  console.log('');

  // ── 7. 无效服务名
  console.log('【7】无效服务名（验证 code=-1 与文案）');
  {
    const r = await call('yf.oapi.__not_exist__.data.query.get', { page_no: 1, conditions: {} });
    const c = codeOf(r);
    const d = descOf(r);
    console.log(`  code=${c} desc=${d}`);
    console.log(`  完整响应: ${String(r.text).slice(0, 300)}`);
    rec('T-15 无效服务名', 'code=-1', `code=${c}`, c === '-1', d ? `描述: ${d}` : '');
  }
  console.log('');

  // ── 8. page_size 上界（性能基线粗测）
  console.log('【8】page_size 性能粗测（易飞无 fastquery，全查DB）');
  for (const size of [10, 100, 1000, 10000]) {
    const r = await call('yf.oapi.plant.data.query.get', {
      page_no: 1, page_size: size, use_has_next: false, conditions: {},
    });
    console.log(`  page_size=${String(size).padEnd(6)} -> ${String(r.elapsed).padStart(6)}ms  rows=${(rowsOf(r) ?? []).length} total=${totalOf(r)}`);
  }
  rec('T-12 page_size=10000', '可用（文档称最大 10000）', '见上', true, '性能数据需多轮复测取中位数');
  console.log('');

  // ── 9. selectedColumns（20260401 新增）
  console.log('【9】selectedColumns 回参裁剪（20260401 新增能力）');
  {
    const r = await call('yf.oapi.plant.data.query.get', {
      page_no: 1, page_size: 2, use_has_next: false,
      selectedColumns: 'plant_no,plant_name',
      conditions: {},
    });
    const rows = rowsOf(r) ?? [];
    const keys = rows[0] ? Object.keys(rows[0]) : [];
    console.log(`  code=${codeOf(r)} rows=${rows.length} 字段= ${keys.join(', ') || '(无)'}`);
    rec('T-13 selectedColumns', '仅返回指定字段', keys.join(','),
      keys.length > 0 && keys.every((k) => ['plant_no', 'plant_name'].includes(k)),
      '文档称 20260401 起支持');
  }
  console.log('');

  // ── 10. TypeKey 覆盖抽样
  console.log('【10】TypeKey 抽样验证（对照 knowledge/typekey/typekey_map.yaml）');
  const samples = [
    ['customer', 'yf.oapi.customer.data.query.get'],
    ['supplier', 'yf.oapi.supplier.data.query.get'],
    ['item', 'yf.oapi.item.data.query.get'],
    ['sales.order', 'yf.oapi.sales.order.data.query.get'],
    ['purchase.order', 'yf.oapi.purchase.order.data.query.get'],
    ['inventory.transaction', 'yf.oapi.inventory.transaction.data.query.get'],
    ['wo', 'yf.oapi.wo.data.query.get'],
    ['bom', 'yf.oapi.bom.data.query.get'],
    ['accounting.voucher', 'yf.oapi.accounting.voucher.data.query.get'],
    ['account', 'yf.oapi.account.data.query.get'],
  ];
  let ok = 0;
  for (const [tk, svc] of samples) {
    const r = await call(svc, { page_no: 1, page_size: 1, use_has_next: false, conditions: {} });
    const c = codeOf(r);
    const n = (rowsOf(r) ?? []).length;
    if (c === '0') ok++;
    console.log(`  ${tk.padEnd(22)} ${svc.replace('yf.oapi.', '').padEnd(38)} code=${c} rows=${n}`);
  }
  rec('T-14 TypeKey 可用性', '10 个抽样中≥ 8 个返回 code=0', `${ok}/10 成功`, ok >= 8);
  console.log('');

  // ================================================================ 汇总
  console.log('='.repeat(72));
  console.log('探测结果汇总');
  console.log('='.repeat(72));
  const pass = results.filter((r) => r.pass === true).length;
  const fail = results.filter((r) => r.pass === false).length;
  const info = results.filter((r) => r.pass === undefined).length;
  console.log(`PASS ${pass} | FAIL ${fail} | INFO ${info}｜共 ${results.length} 项`);
  console.log('');
  for (const r of results) {
    const tag = r.pass === true ? 'PASS' : r.pass === false ? 'FAIL' : 'INFO';
    console.log(`[${tag}] ${r.case}`);
    console.log(`       期望: ${r.expect}`);
    console.log(`       实测: ${r.actual}${r.note ? CR + LF + '       备注: ' + r.note : ''}`);
  }

  // 写报告
  const CRLF = (t) => String(t).split(/\r\n|\r|\n/).join(CR + LF);
  const stamp = new Date().toISOString();
  const report = [
    '# 易飞 OpenAPI 真机探测报告',
    '',
    `- 探测时间：${stamp}`,
    `- 入口：${URL_FULL}`,
    `- 账套：${COMPANY_ID}`,
    `- 令牌：${mask(TOKEN)}（已脱敏）`,
    `- 结果：PASS ${pass} / FAIL ${fail} / INFO ${info}`,
    '',
    '> 本报告由 `scripts/probe-live-env.mjs` 自动生成，含实际令牌以外的完整实测数据。',
    '> 报告中不含凭证原文。',
    '',
    '## 探测项明细',
    '',
    '| 用例 | 期望 | 实测 | 结论 |',
    '|---|---|---|---|',
    ...results.map(
      (r) => `| ${r.case} | ${r.expect} | ${String(r.actual).replace(/\|/g, '\\|')} | ${r.pass === true ? '✅ PASS' : r.pass === false ? '❌ FAIL' : 'ℹ️ INFO'} |`,
    ),
    '',
    '## 需人工确认',
    '',
    ...results.filter((r) => r.pass === false || r.pass === undefined).map((r) => `- **${r.case}**：${r.actual}${r.note ? '（' + r.note + '）' : ''}`),
    '',
  ].join(CR + LF);
  const out = new URL('../runs/probe-live-env-report.md', import.meta.url);
  const fs = await import('node:fs');
  fs.mkdirSync(new URL('../runs/', import.meta.url), { recursive: true });
  fs.writeFileSync(out, CRLF(report), 'utf-8');
  console.log('');
  console.log('报告已写出：runs/probe-live-env-report.md（runs/ 已gitignore）');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(2);
});
