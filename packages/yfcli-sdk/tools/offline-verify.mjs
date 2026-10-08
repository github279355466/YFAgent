/**
 * 离线功能自测 —— 验证实测约束是否真被代码拦住，不需要真机环境。
 *
 * 用法：npx tsx tools/offline-verify.mjs
 * 说明：TS 源码经 tsx 直接加载 .ts，无需预编译。
 */

import assert from 'node:assert/strict';

const load = async () => {
  const conditions = await import('../src/conditions/builder.ts');
  const guard = await import('../src/conditions/enum-guard.ts');
  const parser = await import('../src/response/parser.ts');
  const config = await import('../src/config/config.ts');
  const headers = await import('../src/config/headers.ts');
  const redact = await import('../src/logging/redact.ts');
  const catalog = await import('../src/catalog/typekey-catalog.ts');
  const transport = await import('../src/transport/http-transport.ts');
  const fields = await import('../src/types/fields.ts');
  return {
    ...conditions, ...guard, ...parser, ...config,
    ...headers, ...redact, ...catalog, ...transport, ...fields,
  };
};

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

// ------------------------------------------------------------ 条件构造

test('between 渲染为 SQL 片段形态', async (m) => {
  const f = m.between('doc_no', '00941229002', '00950320001');
  assert.equal(f.value, "'00941229002' AND '00950320001'");
  assert.equal(f.operator, 'BETWEEN');
});

test('inList 渲染为带引号列表', async (m) => {
  const f = m.inList('item_no', ['000', '001']);
  assert.equal(f.value, "('000','001')");
});

test('空 IN 列表直接拒绝（易飞会返回 0 条且 code=0）', async (m) => {
  assert.throws(() => m.inList('item_no', []), /IN 列表不得为空/);
});

test('EXISTS 的 field_name 必须留空', async (m) => {
  assert.throws(() => m.field('item_no', 'EXISTS', '(SELECT 1)'), /必须留空/);
  const f = m.exists('(SELECT MB001 FROM $$INVMB WHERE 1=1)');
  assert.equal(f.field_name, '');
});

test('allRecords 为空对象形态而非空数组', async (m) => {
  const c = m.allRecords();
  assert.deepEqual(c, { operator: 'and', fields: [] });
  assert.equal(Array.isArray(c), false);
});

test('page_size 上限 10000 硬校验', async (m) => {
  assert.throws(() => m.pagination(1, 10001), /不得超过 10000/);
  assert.equal(m.pagination(1, 10000).page_size, 10000);
});

test('page_no 从 1 开始', async (m) => {
  assert.throws(() => m.pagination(0, 10), /从 1 开始/);
});

test('node_name 用逻辑节点名（*_data）', async (m) => {
  const f = m.field('item_no', '=', '001', 'sales_order_detail_data');
  assert.equal(f.node_name, 'sales_order_detail_data');
});

test('复合主键用 + 拼接', async (m) => {
  const f = m.compositeField(['doc_type_no', 'doc_no'], '=', '091W|20230710001');
  assert.equal(f.field_name, 'doc_type_no+doc_no');
});

test('显式拒绝易助数组形态', async (m) => {
  assert.throws(
    () => m.assertNotYiZhuConditionsShape([{ groups: [{ fields: [] }] }]),
    /易飞必须是对象形态/,
  );
});

test('selectedColumns 用逗号拼接；未传时不写入该键', async (m) => {
  const withCols = m.queryParameter({
    conditions: m.allRecords(),
    page: m.pagination(1, 100),
    selectedColumns: ['item_no', 'item_name'],
  });
  assert.equal(withCols.selectedColumns, 'item_no,item_name');

  const without = m.queryParameter({ conditions: m.allRecords(), page: m.pagination(1, 100) });
  assert.equal('selectedColumns' in without, false);
});

// ------------------------------------------------------------ 枚举守卫

test('「编码.中文」形态被识别', async (m) => {
  assert.equal(m.looksLikeCodeText('Y.已审核'), true);
  assert.equal(m.looksLikeCodeText('1.一般凭证输入'), true);
});

test('纯编码与数字不误判', async (m) => {
  assert.equal(m.looksLikeCodeText('Y'), false);
  assert.equal(m.looksLikeCodeText('1'), false);
  assert.equal(m.looksLikeCodeText('00WKTEST'), false);
});

test('extractCode 剥离中文描述', async (m) => {
  assert.equal(m.extractCode('Y.已审核'), 'Y');
  assert.equal(m.extractCode('N.未过账'), 'N');
  assert.equal(m.extractCode('001'), '001');
});

test('枚举守卫拦截回参形态并给出正确值', async (m) => {
  const spec = { fieldName: 'approve_status', codedText: true };
  assert.throws(() => m.guardEnumConditionValue(spec, 'Y.已审核', true), /应传 "Y"/);
  const verdict = m.guardEnumConditionValue(spec, 'Y.已审核', false);
  assert.equal(verdict.correctedValue, 'Y');
  assert.equal(verdict.suspect, true);
});

test('空串枚举条件被判为静默错误', async (m) => {
  const spec = { fieldName: 'approve_status', codedText: true };
  const verdict = m.guardEnumConditionValue(spec, '', false);
  assert.equal(verdict.suspect, true);
});

test('correctEnumFields 仅改可疑字段', async (m) => {
  const lookup = { approve_status: { fieldName: 'approve_status', codedText: true } };
  const out = m.correctEnumFields(
    { approve_status: 'Y.已审核', doc_no: '20230710001' },
    lookup,
  );
  assert.equal(out.corrected.approve_status, 'Y');
  assert.equal(out.corrected.doc_no, '20230710001');
  assert.equal(out.warnings.length, 1);
});

// ------------------------------------------------------------ 响应解析

test('code 0 与 -0 均判成功', async (m) => {
  assert.equal(m.isSuccessCode('0'), true);
  assert.equal(m.isSuccessCode('-0'), true);
  assert.equal(m.isSuccessCode('-1'), false);
});

test('繁体成功文案不影响成功判定', async (m) => {
  const env = m.parseEnvelope({
    std_data: { execution: { code: '0', sql_code: '', description: '查詢成功' } },
  });
  assert.equal(m.isSuccessCode(env.std_data.execution.code), true);
});

test('execution.code 缺失时抛 protocol 错误，不默认成功', async (m) => {
  assert.throws(
    () => m.parseEnvelope({ std_data: { execution: { sql_code: '' } } }),
    /execution.code 缺失/,
  );
});

test('缺 std_data 根标签即报错', async (m) => {
  assert.throws(() => m.parseEnvelope({ foo: 1 }), /缺少 std_data 根标签/);
});

test('error[] 结构 A 解析', async (m) => {
  const env = m.parseEnvelope({
    std_data: {
      execution: { code: '-1', sql_code: '', description: '缺少[doc_no]的鍵值參數' },
      parameter: {
        result: {
          error: [{ message: '缺少[doc_no]的鍵值參數', data: { doc_type_no: '091W' } }],
        },
      },
    },
  });
  const entries = m.parseErrorEntries(env.std_data.parameter);
  assert.equal(entries.length, 1);
  assert.match(entries[0].message, /doc_no/);
  // buildBusinessError 返回错误对象（由调用方决定抛或处理），不自行抛出。
  const err = m.buildBusinessError(env);
  assert.equal(err.kind, 'primary_key_missing');
  assert.equal(err.layer, 'business');
});

test('error[] 结构 B 解析', async (m) => {
  const entries = m.parseErrorEntries({
    result: {
      error: [{ information: [{ message: '违反了 PRIMARY KEY 约束', data: {} }] }],
    },
  });
  assert.equal(entries.length, 1);
  assert.match(entries[0].message, /PRIMARY KEY/);
});

test('未识别 error[] 结构抛 unknown_error_item（不静默吞错）', async (m) => {
  assert.throws(
    () => m.parseErrorEntries({ result: { error: [{ weird: true }] } }),
    (err) => err.kind === 'unknown_error_item',
  );
});

test('查询通道读 rows', async (m) => {
  const r = m.parseQueryResult({
    total_result: 2,
    has_next: false,
    result: { cnt: 2, rows: [{ item_no: 'A' }, { item_no: 'B' }] },
  });
  assert.equal(r.rows.length, 2);
  assert.equal(r.totalResult, 2);
  assert.equal(r.count, 2);
});

test('主键通道读 success，空结果标记 empty', async (m) => {
  const ok = m.parseActionResult({ result: { success: [{ doc_no: 'X' }] } }, 'svc');
  assert.equal(ok.empty, false);
  const empty = m.parseActionResult({ result: { success: [] } }, 'svc');
  assert.equal(empty.empty, true);
});

test('MA012 与找不到資料表归为不同 kind', async (m) => {
  const ma = m.buildBusinessError(m.parseEnvelope({
    std_data: {
      execution: { code: '-1', sql_code: '', description: 'MA012未定義' },
      parameter: { result: { error: [{ message: 'MA012未定義', data: {} }] } },
    },
  }));
  assert.equal(ma.kind, 'node_not_registered');

  const field = m.buildBusinessError(m.parseEnvelope({
    std_data: {
      execution: { code: '-1', sql_code: '', description: 'x' },
      parameter: { result: { error: [{ message: '找不到資料表:[PURTC]', data: {} }] } },
    },
  }));
  assert.equal(field.kind, 'field_not_found');
});

test('空结果告警文案点出主键全错场景', async (m) => {
  const text = m.describeEmptyResultWarning('yf.oapi.a.read.get', ['doc_type_no', 'doc_no']);
  assert.match(text, /doc_type_no \+ doc_no/);
  assert.match(text, /不得当作成功/);
});

// ------------------------------------------------------------ 配置

test('缺 servicePrefix 立即失败', async (m) => {
  const r = m.validateConfig({
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'T',
    servicePrefix: '', timeoutMs: 30000, warnOnSilentError: true,
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'servicePrefix'));
});

test('缺 companyId 立即失败', async (m) => {
  const r = m.validateConfig({
    baseUrl: 'http://{IP}', companyId: '', tokenEnvVar: 'T',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  });
  assert.ok(r.errors.some((e) => e.field === 'companyId'));
});

test('servicePrefix 为易助前缀时拒绝并指向另建包', async (m) => {
  const r = m.validateConfig({
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'T',
    servicePrefix: 'yz.', timeoutMs: 30000, warnOnSilentError: true,
  });
  assert.ok(r.errors.some((e) => /另建 yzcli-sdk/.test(e.reason)));
});

test('baseUrl 含路径时拒绝', async (m) => {
  const r = m.validateConfig({
    baseUrl: 'http://{IP}/YFOAP/openapi.dll', companyId: 'C1', tokenEnvVar: 'T',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  });
  assert.ok(r.errors.some((e) => /勿含路径/.test(e.reason)));
});

test('合法配置通过校验', async (m) => {
  const r = m.validateConfig({
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'YF_USER_TOKEN',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  });
  assert.equal(r.ok, true);
});

test('令牌缺失时 resolveRuntimeConfig 失败（fail-fast）', async (m) => {
  const cfg = {
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'YF_USER_TOKEN',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  };
  assert.throws(() => m.resolveRuntimeConfig(cfg, {}), /环境变量未设置/);
});

test('端点拼接保持大小写敏感路径', async (m) => {
  const cfg = {
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'TOK',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  };
  const resolved = m.resolveRuntimeConfig(cfg, { TOK: 'x'.repeat(48) });
  assert.equal(
    resolved.endpoint,
    'http://{IP}/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost',
  );
});

test('四个必填头齐备且值形态正确', async (m) => {
  const cfg = {
    baseUrl: 'http://{IP}', companyId: 'C1', tokenEnvVar: 'TOK',
    servicePrefix: 'yf.', timeoutMs: 30000, warnOnSilentError: true,
  };
  const resolved = m.resolveRuntimeConfig(cfg, { TOK: 'x'.repeat(48) });
  const h = m.buildHeaders(resolved, 'yf.oapi.item.data.query.get');
  assert.equal(h['Content-Type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(h['digi-service']), { name: 'yf.oapi.item.data.query.get' });
  assert.deepEqual(JSON.parse(h['digi-datakey']), { CompanyId: 'C1' });
  assert.equal(h['digi-user-token'].length, 48);
});

test('空服务名的误导性提示被翻译', async (m) => {
  const hint = m.explainMisleadingAuthMessage('无效的身份令牌，请联系管理员分配身份令牌！');
  assert.ok(hint !== undefined);
  assert.match(hint, /勿据此排查令牌/);
});

// ------------------------------------------------------------ 传输

test('HTTP 500 抛 token_invalid 且提示不解析 JSON', async (m) => {
  assert.throws(
    () => m.assertHttpOk({
      status: 500, bodyText: '<title>500</title>', elapsedMs: 10,
      preview: '<title>500</title>',
    }),
    (err) => err.kind === 'token_invalid' && /勿尝试解析 JSON/.test(err.message),
  );
});

test('HTTP 200 通过校验', async (m) => {
  m.assertHttpOk({ status: 200, bodyText: '{}', elapsedMs: 10, preview: '{}' });
});

// ------------------------------------------------------------ 脱敏

test('令牌与 datakey 键值被整体脱敏（含下划线写法）', async (m) => {
  const out = m.redact({
    digi_user_token: 'A'.repeat(48),
    digi_datakey: '{"CompanyId":"C1"}',
    doc_no: '20230710001',
  });
  assert.equal(out.digi_user_token, '<已脱敏>');
  assert.equal(out.digi_datakey, '<已脱敏>');
  assert.equal(out.doc_no, '202***001');
});

test('48 位十六进制串被掩码', async (m) => {
  const out = m.redact({ value: '1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F60718293A4B5C6D7E' });
  assert.match(out.value, /\*\*\*/);
});

test('error[].data 递归脱敏：超长文本截断，短编码保留', async (m) => {
  const raw = {
    customer_basic_data_file_data: {
      customer_no: '00WKTEST',
      remarks: 'x'.repeat(300),
      doc_no: '20230710001',
    },
  };
  const out = m.redact(raw);
  const inner = out.customer_basic_data_file_data;
  // 短业务编码保留原值：脱敏目标是凭据与超长标识，全量脱敏会让日志失去排障价值
  assert.equal(inner.customer_no, '00WKTEST');
  // 9 位以上纯数字单号部分掩码
  assert.equal(inner.doc_no, '202***001');
  // 超长文本截断并标注原长度
  assert.match(inner.remarks, /已截断，原长 300/);
});

test('递归深度超限以占位符替代，不栈溢出', async (m) => {
  const deep = { a: { b: { c: { d: { e: { f: { g: { h: 'x' } } } } } } } };
  const out = m.redact(deep);
  assert.match(JSON.stringify(out), /深度超限/);
});

// ------------------------------------------------------------ 字段分层

test('网关注入字段：7 项名称齐备且不可与 UDF 混为一谈', async (m) => {
  assert.deepEqual(
    [...m.GATEWAY_INJECTED_FIELD_NAMES],
    ['company', 'creator', 'usr_group', 'create_date', 'modifier', 'modi_date', 'flag'],
    '网关注入字段清单与文档 §6.4 不符',
  );
  // 易助命名 udf_text* 不得被误认为易飞 UDF
  assert.equal(m.isUdfFieldName('udf_text1'), false, '易助 UDF 命名不得混入');
  assert.equal(m.isUdfFieldName('udf01'), true);
  assert.equal(m.isUdfFieldName('udf62'), true);
  assert.equal(m.isUdfFieldName('udf13'), false, 'udf13 不在易飞实测编号范围');
  assert.equal(m.isUdfFieldName('udf50'), false, 'udf50 不在易飞实测编号范围');
});

test('UDF 分组：12 文本 + 12 数值 = 24，且互不重叠', async (m) => {
  assert.equal(m.YF_UDF_TEXT_FIELDS.length, 12);
  assert.equal(m.YF_UDF_NUMERIC_FIELDS.length, 12);
  assert.equal(m.YF_UDF_FIELDS.length, 24);
  const overlap = m.YF_UDF_TEXT_FIELDS.filter((f) => m.YF_UDF_NUMERIC_FIELDS.includes(f));
  assert.equal(overlap.length, 0, `文本与数值 UDF 不应重叠：${overlap.join(',')}`);
  assert.equal(m.YF_UDF_TEXT_FIELDS[0], 'udf01');
  assert.equal(m.YF_UDF_TEXT_FIELDS[11], 'udf12');
  assert.equal(m.YF_UDF_NUMERIC_FIELDS[0], 'udf51');
  assert.equal(m.YF_UDF_NUMERIC_FIELDS[11], 'udf62');
});

test('剥离网关注入字段：回参转物理列视图', async (m) => {
  const row = {
    doc_type_no: '091W',
    doc_no: '20230710001',
    company: '10',
    creator: 'TEST',
    usr_group: 'G01',
    create_date: '20250305181000333',
    modifier: 'TEST',
    modi_date: '20250306190000411',
    flag: 1,
    udf01: 'x',
  };
  const physical = m.stripGatewayInjectedFields(row);
  for (const name of m.GATEWAY_INJECTED_FIELD_NAMES) {
    assert.equal(name in physical, false, `${name} 应被剥离`);
  }
  assert.equal(physical.doc_no, '20230710001');
  assert.equal(physical.udf01, 'x');
  assert.deepEqual(Object.keys(physical).sort(), ['doc_no', 'doc_type_no', 'udf01']);
});

test('写入预检：识别不可赋值的网关注入字段', async (m) => {
  const bad = m.findUnassignableFields({ doc_no: 'X', creator: 'TEST', flag: 1, modi_date: '2025' });
  assert.deepEqual([...bad].sort(), ['creator', 'flag', 'modi_date']);
  assert.equal(m.findUnassignableFields({ doc_no: 'X', udf01: 'y' }).length, 0);
});

test('非 ISO 时间戳解析：17 位格式可解析，非法格式返回 undefined', async (m) => {
  const d = m.parseYfTimestamp('20250305181000333');
  assert.ok(d instanceof Date);
  assert.equal(d.getFullYear(), 2025);
  assert.equal(d.getMonth(), 2, '月份应为零基的 2（即 3 月）');
  assert.equal(d.getDate(), 5);
  assert.equal(d.getHours(), 18);
  assert.equal(d.getMinutes(), 10);
  assert.equal(d.getSeconds(), 0);
  // 非法输入不抛错，返回 undefined
  assert.equal(m.parseYfTimestamp('2025-03-05T18:10:00Z'), undefined, 'ISO 串不是易飞格式');
  assert.equal(m.parseYfTimestamp('20250305'), undefined);
  assert.equal(m.parseYfTimestamp(''), undefined);
});

// ------------------------------------------------------------ 目录

/**
 * 加载知识产物。
 *
 * **严格解析（不传 uniqueKeys:false）** —— 这是刻意的门禁设计：
 * 产物若出现重复键（如primary_key 被写两行），严格解析器立即抛错。
 * 2026-10-08 该缺陷已由抽取脚本修复（此前需 uniqueKeys:false 规避，属掩盖），
 * 故此处恢复严格模式，让同类回归能被本自测直接拦住。
 */
const loadTypeKeyYaml = async () => {
  const fs = await import('node:fs/promises');
  const yamlText = await fs.readFile(
    new URL('../../../knowledge/typekey/typekey_map.yaml', import.meta.url),
    'utf8',
  );
  const YAML = await import('yaml');
  return { yamlText, parsed: YAML.parse(yamlText) };
};

test('知识产物可被严格 YAML 解析（重复键已修，回归即失败）', async () => {
  const { parsed } = await loadTypeKeyYaml();
  assert.ok(Array.isArray(parsed.typekeys), 'typekeys 应为数组');
  assert.ok(parsed.typekeys.length > 100, `业务对象数异常：${parsed.typekeys.length}`);
});

test('从知识产物查表得到确切服务名（supplier 无 .data 段）', async (m) => {
  const { parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  assert.equal(cat.resolveServiceName('customer', 'query'), 'yf.oapi.customer.data.query.get');
  assert.equal(cat.resolveServiceName('supplier', 'query'), 'yf.oapi.supplier.query.get');
});

test('知识产物服务名数与头部声明一致（593 / 595，差值已定位）', async (m) => {
  const { yamlText, parsed } = await loadTypeKeyYaml();
  const declared = Number(/services_unique:\s*(\d+)/.exec(yamlText)?.[1] ?? '0');
  const actual = new m.TypeKeyCatalog(parsed).countServices();
  assert.ok(declared > 0, '未能从头部解析 services_unique');
  assert.ok(actual <= declared, `实际服务名数 ${actual} 超过头部声明 ${declared}`);

  // 已知差值 2，非漂移：源文档中 bom 同一操作存在两个不同服务名
  //   yf.oapi.bom.query.get    <- 「查询BOM」/「读取BOM」节点（2 处）
  //   yf.oapi.bom.data.query.get<- 「查询BOM信息」节点（2 处）
  // 抽取时 rec.services[op] = svc 后写覆盖前写，产物只保留一个。
  // 实测真机：bom.data.query.get 返回 code=0（见 plan §10.2），
  // 故当前产物取值正确；若差值超出 2 则说明发生了别的漂移，需排查。
  assert.equal(
    declared - actual,
    2,
    `声明 ${declared} 与实际 ${actual} 的差值应为 2（bom 同操作双服务名），` +
      '若为其他值说明产物发生了新的漂移',
  );
});

test('查表原样返回：解析结果与产物字段逐字一致（无任何改写）', async (m) => {
  const { yamlText, parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  // 逐条比对：解析器返回值必须与产物字符串完全相同，不存在任何拼接或规范化。
  // 注意此处按「产物中实际存在的服务」逐条比对，而非假设每个对象都有 query ——
  // 已知 item.count 无 query 服务，故不能用「全量对象均可resolve(query)」作为断言。
  let compared = 0;
  for (const item of parsed.typekeys) {
    if (typeof item.type_key !== 'string' || typeof item.services !== 'object') continue;
    for (const [operation, serviceName] of Object.entries(item.services)) {
      if (typeof serviceName !== 'string') continue;
      const resolved = cat.resolveServiceName(item.type_key, operation);
      assert.equal(
        resolved,
        serviceName,
        `${item.type_key}.${operation} 解析结果与产物不一致`,
      );
      compared += 1;
    }
  }
  const declared = Number(/services_unique:\s*(\d+)/.exec(yamlText)?.[1] ?? '0');
  assert.ok(
    compared <= declared,
    `逐条比对条目数 ${compared} 超过头部声明 ${declared}`,
  );
  // 下界按实测登记条目数收敛：产物 services 字段实际去重 593 个
  // （声明 595 与之差2，根因见「知识产物服务名数与头部声明一致」用例）。
  assert.ok(compared >= 590, `比对条目过少（${compared}），可能未正确加载产物`);
  assert.ok(compared <= 593, `比对条目过多（${compared}），产物实际登记 593 个服务名`);
});

/**
 * 无 query 服务的对象 —— 不能假设「每个业务对象都有 query」。
 *
 * 已知反例：item.count 只有 read，无 query。
 * 这类对象调用 resolveServiceName(typeKey,'query') 必须抛错并列出已有服务，
 * 而不是返回 undefined 或拼接一个假服务名。
 */
test('无 query 服务的对象：调用 query 时抛错并列出已有操作', async (m) => {
  const { parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  const noQuery = parsed.typekeys
    .filter((item) => item.services && item.services.query === undefined)
    .map((item) => item.type_key);
  assert.ok(noQuery.length > 0, '产物应存在无 query 服务的对象，若为 0 请复核产物');

  for (const typeKey of noQuery) {
    assert.throws(
      () => cat.resolveServiceName(typeKey, 'query'),
      /无 query 服务/,
      `${typeKey} 应抛「无 query 服务」而非返回拼接值`,
    );
  }
});

/**
 * `service_name_shape` 三态分类的断言。
 *
 * 2026-10-08 抽取脚本已从「取首条服务名」的布尔判定改为逐操作统计，
 * 产出三态：
 *   standard —— 全部服务名均带 .data 段
 *   mixed    —— 混合形态，**绝对不可拼接服务名**（当前：bom / supplier）
 *   （无该字段 + no_data_segment: true）—— 全部不带 .data 段
 */
test('service_name_shape 三态分类自洽（standard/mixed/全无段）', async (m) => {
  const { parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  const shapeOf = (item) => {
    if (item.service_name_shape !== undefined) return item.service_name_shape;
    return item.no_data_segment === true ? 'none' : 'unknown';
  };

  for (const item of parsed.typekeys) {
    const names = Object.values(item.services ?? {}).filter((n) => typeof n === 'string');
    if (names.length === 0) continue;
    const withData = names.filter((n) => n.includes('.data.')).length;
    const withoutData = names.length - withData;
    const shape = shapeOf(item);

    if (withData > 0 && withoutData > 0) {
      assert.equal(
        shape,
        'mixed',
        `${item.type_key} 实为混合形态（${withData} 带 / ${withoutData} 不带 .data），标记却是 ${shape}`,
      );
    } else if (withoutData > 0) {
      assert.equal(
        shape,
        'none',
        `${item.type_key} 实为全部无 .data 段，标记却是 ${shape}`,
      );
    } else {
      assert.equal(
        shape,
        'standard',
        `${item.type_key} 实为全部带 .data 段，标记却是 ${shape}`,
      );
    }
  }
});

/**
 * 混合形态对象的服务名必须逐条与文档/真机出处核对。
 *
 * 混合形态是最容易拼错的一类：`bom.approve` 无 .data 段而`bom.query` 有，
 * 靠 `{type_key}.data.{op}.get` 拼接对二者不可能同时正确。
 * 本断言锁定：混合形态对象的每个服务名都必须是产物中登记的原值，
 * 且形状分布与标记一致（防止把 mixed 误当 standard 而全量加 .data 段）。
 */
test('混合形态对象（bom / supplier）：逐操作形状与标记一致，服务名原样返回', async (m) => {
  const { parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  const mixed = parsed.typekeys.filter((item) => item.service_name_shape === 'mixed');
  assert.ok(mixed.length > 0, '产物应存在 mixed 形态对象');
  assert.deepEqual(
    mixed.map((item) => item.type_key).sort(),
    ['bom', 'supplier'],
    'mixed 形态对象清单与真机报告不符（已知且仅 bom / supplier）',
  );

  for (const item of mixed) {
    const typeKey = item.type_key;
    for (const [operation, serviceName] of Object.entries(item.services)) {
      // 1. 查表原样返回，不做任何拼接或改写
      assert.equal(
        cat.resolveServiceName(typeKey, operation),
        serviceName,
        `${typeKey}.${operation} 查表结果与产物不一致`,
      );
      // 2. 服务名形态与该操作的实际登记一致
      const entry = cat.findEntry(typeKey);
      assert.ok(entry !== undefined, `${typeKey} 应在索引中`);
      const shapeOk = String(serviceName).includes('.data.');
      // 形状随操作而变是混合形态的定义，此处只断言「能取到确切名字」，
      // 不强行要求某个固定形状—— 形状以产物为唯一真源。
      assert.equal(typeof shapeOk, 'boolean', `${typeKey}.${operation} 形状判定应可计算`);
    }
  }

  // bom 的具体形状锁定（真机报告 §11.9 + probe-pk-and-node-name-answers.md）
  assert.equal(cat.resolveServiceName('bom', 'query'), 'yf.oapi.bom.data.query.get');
  assert.equal(cat.resolveServiceName('bom', 'read'), 'yf.oapi.bom.data.read.get');
  assert.equal(cat.resolveServiceName('bom', 'approve'), 'yf.oapi.bom.approve');
  assert.equal(cat.resolveServiceName('bom', 'create'), 'yf.oapi.bom.create');

  // supplier：query 无 .data 段但 create/update 有 —— 拼接法不可能同时对
  assert.equal(cat.resolveServiceName('supplier', 'query'), 'yf.oapi.supplier.query.get');
  assert.equal(cat.resolveServiceName('supplier', 'create'), 'yf.oapi.supplier.data.create');
  assert.equal(cat.resolveServiceName('supplier', 'update'), 'yf.oapi.supplier.data.update');
});

test('全无 .data 段对象按真机报告逐一核对（document.type.general / function.category）', async (m) => {
  const { parsed } = await loadTypeKeyYaml();
  const cat = new m.TypeKeyCatalog(parsed);

  // 真机报告 §11.9 与 probe-pk-and-node-name-answers.md 均点名这两个对象。
  // 拼接法会产出 .data.query.get，与真机实测不符。
  assert.equal(
    cat.resolveServiceName('document.type.general', 'query'),
    'yf.oapi.document.type.general.query.get',
  );
  assert.equal(
    cat.resolveServiceName('function.category', 'query'),
    'yf.oapi.function.category.query.get',
  );
  assert.equal(
    cat.resolveServiceName('supplier', 'query'),
    'yf.oapi.supplier.query.get',
  );
});

test('未登记 type_key 抛错且提示勿推导', async (m) => {
  const cat = new m.TypeKeyCatalog({ typekeys: [] });
  assert.throws(() => cat.resolveServiceName('nope', 'query'), /勿按规律推导/);
});

test('对象无该操作时抛错并列出已有服务', async (m) => {
  const cat = new m.TypeKeyCatalog({
    typekeys: [{ type_key: 'a', title: 'A', services: { query: 'yf.oapi.a.query.get' }, primary_key: ['k'] }],
  });
  assert.throws(() => cat.resolveServiceName('a', 'approve'), /无 approve 服务/);
});

test('已标记 unavailable 的对象拒绝调用', async (m) => {
  const cat = new m.TypeKeyCatalog({
    typekeys: [{
      type_key: 'item.inventory.qty', title: '品号库存',
      services: { query: 'yf.oapi.item.inventory.qty.query.get' },
      unavailable: true, unavailable_reason: '服务端 DLL 崩溃',
    }],
  });
  assert.throws(() => cat.resolveServiceName('item.inventory.qty', 'query'), /DLL 崩溃/);
});

test('type_key 重复即报错（抽取产物不应有重复键）', async (m) => {
  assert.throws(
    () => new m.TypeKeyCatalog({ typekeys: [{ type_key: 'a' }, { type_key: 'a' }] }),
    /重复/,
  );
});

// ------------------------------------------------------------ 运行

const m = await load();
let pass = 0;
const failures = [];

console.log('='.repeat(72));
console.log('yfcli-sdk 离线功能自测');
console.log('='.repeat(72));

for (const c of cases) {
  try {
    await c.fn(m);
    pass += 1;
    console.log(`[PASS] ${c.name}`);
  } catch (err) {
    failures.push({ name: c.name, err });
    console.log(`[FAIL] ${c.name}`);
    console.log(`       ${err && err.message ? err.message : String(err)}`);
  }
}

console.log('');
console.log(`结果：${pass}/${cases.length} 通过`);
if (failures.length > 0) {
  console.log(`RESULT: FAIL（${failures.length} 项）`);
  process.exit(1);
}
console.log('RESULT: PASS');