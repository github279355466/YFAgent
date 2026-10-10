/**
 * 真机场景 · 主数据 CRUD（query / read / create / update / delete）
 *
 * 覆盖对象：plant / customer / supplier / item / warehouse
 *
 * 关键实测约束（本文件据此构造数据）：
 *   1. **写操作容器值必须是数组**：`{ <container>: [ {...} ] }`。
 *      传单对象 → `DoAction Exception:没有活动事务。`（不报字段错误，极难定位）。
 *   2. **容器名必须查证**：customer 用 `customer_basic_data_file_data`，
 *      不叫 `customer_data`（按对象名推测必错）。
 *   3. **主键是定长 char(N)**：超长被 SQL 拒绝（「将截断字符串或二进制数据」）。
 *
 * 默认 skip；YF_LIVE=1 时按真实 ERP 执行。
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  isLiveEnabled,
  getSession,
  runScenario,
  recordResidual,
  recordDefect,
  testKey,
  isSuccessEnvelope,
  extractRows,
  extractTotal,
  extractSuccessItems,
  extractErrorMessages,
  countRealRecords,
  firstNodePayload,
  type ScenarioResult,
  scenarioResults,
  defectRecords,
  residualRecords,
} from './helpers.js';
import { writeSidecar } from './sidecar.js';

const LIVE = isLiveEnabled();

interface MasterObject {
  typeKey: string;
  primaryKey: string;
  /** 主键列定长宽度（char(N)），测试键不得超出，否则被 SQL 截断报错 */
  keyLen: number;
  /** 写操作容器名（真机查证，非按对象名推测） */
  container: string;
  /** 名称字段名与列宽 */
  nameField: string;
  nameLen: number;
  /** update 时改的字段与目标值 */
  updateField: string;
  updateValue: string;
  /**
   * create 额外必填字段及**取值来源**。
   *
   * 真机取证（2026-10-10）：字段名由 create 的
   * `error[].information[].data` 精确给出（文案「字段不可空白!」），
   * 但**值必须取账套真实存在的编码**，否则会转为
   * 「输入的信息不符合范围!」。故用 `from` 指定从哪个对象的哪个字段取样。
   *
   * 枚举回参是「编码.中文」，作写操作入参时只认纯编码（`split('.')[0]`）。
   */
  createFields?: ReadonlyArray<{
    field: string;
    /** 从该 type_key 的该字段取样（取第一条非空值，并剥离「编码.中文」的中文部分） */
    from: { typeKey: string; field: string };
  }>;
  /** 若为 true，该字段缺失时允许留空回退（仅用于确实无法取样的对象） */
  allowMissingCreateField?: boolean;
  /**
   * update 的**官方白名单**（取自 docs/易飞OpenAPI.json 该对象 update 服务的 raw 样本）。
   *
   * 真机取证（2026-10-10）：把 read 的全量字段（customer 140 / supplier 109 /
   * item 151 / warehouse 45 个）原样回传都会被拒，报错 data 点名「只读或需转码」的字段：
   *   「不可修改!」           → 系统维护/汇总字段（valid_status、inventory_qty、export_code 等）
   *   「输入的信息不符合范围!」 → 枚举回参是「编码.中文」，update 只认**纯编码**
   * 故 update 必须按官方样本白名单下发，且枚举值要 split('.')[0]。
   *   item 的官方样本只有 datakeys + item_no（无单头字段），故白名单极短。
   */
  updateWhitelist: readonly string[];
}

const MASTER_OBJECTS: MasterObject[] = [
  {
    typeKey: 'plant',
    primaryKey: 'plant_no',
    keyLen: 6,
    container: 'plant_data',
    nameField: 'plant_name',
    nameLen: 20,
    updateField: 'plant_name',
    updateValue: 'T-PLANT-RENAMED',
    updateWhitelist: ['plant_no', 'plant_name'],
  },
  {
    typeKey: 'customer',
    primaryKey: 'customer_no',
    keyLen: 10,
    container: 'customer_basic_data_file_data',
    nameField: 'customer_name',
    nameLen: 20,
    updateField: 'customer_name',
    updateValue: 'T-CUST-RENAMED',
    updateWhitelist: ['customer_no', 'invoice_type', 'taxed_code'],
    // 真机实测缺失清单：{trans_currency, invoice_type, taxed_code}
    createFields: [
      { field: 'trans_currency', from: { typeKey: 'customer', field: 'trans_currency' } },
      { field: 'invoice_type', from: { typeKey: 'customer', field: 'invoice_type' } },
      { field: 'taxed_code', from: { typeKey: 'customer', field: 'taxed_code' } },
    ],
  },
  {
    typeKey: 'supplier',
    primaryKey: 'supplier_no',
    keyLen: 10,
    container: 'supplier_basic_data',
    nameField: 'supplier_name',
    nameLen: 20,
    updateField: 'supplier_name',
    updateValue: 'T-SUPP-RENAMED',
    updateWhitelist: [
      'supplier_no', 'supplier_name', 'supplier_fullname', 'telephone', 'fax_no',
      'contact_address_2', 'taxed_code', 'allow_batch_delivery', 'doc_printing_format',
      'deposit_rate', 'tax_rate', 'settlement_method_no', 'purchaser', 'remarks',
    ],
    // 真机实测缺失清单：{settlement_method_no}
    createFields: [
      { field: 'settlement_method_no', from: { typeKey: 'supplier', field: 'settlement_method_no' } },
    ],
  },
  {
    typeKey: 'item',
    primaryKey: 'item_no',
    keyLen: 20,
    container: 'item_basic_data',
    nameField: 'item_name',
    nameLen: 20,
    updateField: 'item_name',
    updateValue: 'T-ITEM-RENAMED',
    // item 的官方 update 样本仅含 datakeys + item_no（无单头字段），白名单极短
    updateWhitelist: ['item_no'],
    // 真机实测缺失清单：{inventory_unit, item_classification_1, main_warehouse_no, purchase_unit, pricing_unit}
    createFields: [
      { field: 'inventory_unit', from: { typeKey: 'item', field: 'inventory_unit' } },
      { field: 'item_classification_1', from: { typeKey: 'item', field: 'item_classification_1' } },
      { field: 'main_warehouse_no', from: { typeKey: 'item', field: 'main_warehouse_no' } },
      { field: 'purchase_unit', from: { typeKey: 'item', field: 'inventory_unit' } },
      { field: 'pricing_unit', from: { typeKey: 'item', field: 'inventory_unit' } },
    ],
  },
  {
    typeKey: 'warehouse',
    primaryKey: 'warehouse_no',
    keyLen: 10,
    container: 'warehouse_data',
    nameField: 'warehouse_name',
    nameLen: 20,
    updateField: 'warehouse_name',
    updateValue: 'T-WH-RENAMED',
    updateWhitelist: [
      'warehouse_no', 'warehouse_name', 'om_site_id', 'telephone', 'fax_no', 'address',
    ],
    // 真机实测缺失清单：{plant_no}
    createFields: [
      { field: 'plant_no', from: { typeKey: 'plant', field: 'plant_no' } },
    ],
  },
];

/** 断言场景未 FAIL（WARN 允许，但必须有 note 说明原因）。 */
function assertNotFailed(r: ScenarioResult): void {
  if (r.verdict === 'WARN' && !r.note) {
    throw new Error(`[${r.scenario}] 标注 WARN 但未给出原因`);
  }
  expect(r.verdict, `[${r.scenario}] ${r.actual}${r.note ? ' | ' + r.note : ''}`).not.toBe('FAIL');
}

describe.skipIf(!LIVE)('真机 · 主数据 CRUD', () => {
  for (const obj of MASTER_OBJECTS) {
    describe(obj.typeKey, () => {
      let sampleKey: Record<string, unknown> | undefined;
      let createdKey: string | undefined;

      it(`${obj.typeKey} / query 全量取数`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/query`,
            object: obj.typeKey,
            operation: 'query',
            expected: 'code=0 且返回 rows',
          },
          async () => {
            const session = await getSession();
            const call = await session.callTool('yf_query', { type_key: obj.typeKey, page_size: 5 });
            if (call.parsed?.['error']) {
              throw new Error(`yf_query 返回 error：${JSON.stringify(call.parsed['error'])}`);
            }
            const rows = extractRows(call.parsed);
            const first = rows[0];
            if (first?.[obj.primaryKey] !== undefined) {
              sampleKey = { [obj.primaryKey]: first[obj.primaryKey] };
            }
            const total = extractTotal(call.parsed) ?? (call.parsed?.['total_result'] as number | undefined);
            return {
              actual: `count=${rows.length} total=${total ?? 'n/a'}`,
              verdict: rows.length > 0 ? 'PASS' : 'WARN',
              note: rows.length > 0 ? '' : '该账套此对象无数据，read/update 场景将跳过',
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${obj.typeKey} / read 按真实主键回读`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/read`,
            object: obj.typeKey,
            operation: 'read',
            expected: 'code=0 且 result 非空',
          },
          async () => {
            if (!sampleKey) {
              return { actual: '跳过（无样本主键）', verdict: 'WARN', note: 'query 未取到数据' };
            }
            const session = await getSession();
            const call = await session.callTool('yf_read', { type_key: obj.typeKey, datakeys: [sampleKey] });
            const items = extractSuccessItems(call.parsed);
            const real = countRealRecords(items);
            if (real === 0) {
              recordDefect({
                id: `READ-EMPTY-${obj.typeKey}`,
                title: `${obj.typeKey} read 按已知主键返回空`,
                detail: `datakeys=${JSON.stringify(sampleKey)} 返回空。易飞主键全错也返 code=0，须依赖空结果告警。`,
                severity: 'major',
                scenario: `主数据/${obj.typeKey}/read`,
              });
            }
            return {
              actual: `datakeys=${JSON.stringify(sampleKey)} 有效记录=${real} 外层元素=${items.length}`,
              verdict: real > 0 ? 'PASS' : 'WARN',
              note: real > 0 ? '' : '已知主键却返空 —— 已登记缺陷',
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${obj.typeKey} / read 主键全错 → code=0 + 空数组告警`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/read-空结果告警`,
            object: obj.typeKey,
            operation: 'read',
            expected: 'code=0 且 result 为空（证明不能用 code 判断“查到了”）',
          },
          async () => {
            const session = await getSession();
            const badKey: Record<string, unknown> = { [obj.primaryKey]: 'ZZ_NOT_EXIST_999999' };
            const call = await session.callTool('yf_read', { type_key: obj.typeKey, datakeys: [badKey] });
            const items = extractSuccessItems(call.parsed);
            const real = countRealRecords(items);
            return {
              actual: `外层元素=${items.length} 有效记录=${real}（服务端 item_count/empty 不可信）`,
              verdict: real === 0 ? 'PASS' : 'FAIL',
              note:
                real === 0
                  ? '符合硬约束：主键全错返 code=0 + 空节点，调用方必须下钻判断，不能只看 item_count'
                  : '异常：不存在的错误主键竟返回了数据',
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${obj.typeKey} / create 新增`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/create`,
            object: obj.typeKey,
            operation: 'create',
            expected: 'code=0 且 read 复核可查到',
          },
          async () => {
            const session = await getSession();
            const key = testKey(obj.keyLen);
            const head: Record<string, unknown> = {
              [obj.primaryKey]: key,
              [obj.nameField]: 'T-MASTER-CREATE'.slice(0, obj.nameLen),
            };

            // create 额外必填字段：值从**账套真实数据**取样，不能凭猜。
            //   真机取证（2026-10-10）：字段名由 error[].information[].data 给出
            //   （文案「字段不可空白!」）；值不存在时会转成「输入的信息不符合范围!」。
            //   枚举回参是「编码.中文」，写操作只认纯编码。
            const missing: string[] = [];
            for (const cf of obj.createFields ?? []) {
              if (cf.field in head) continue;
              const q = await session.callTool('yf_query', {
                type_key: cf.from.typeKey,
                page_size: 50,
                selectedColumns: cf.from.field,
              });
              const values = extractRows(q.parsed)
                .map((row) => row[cf.from.field])
                .filter((v): v is string | number => v !== undefined && v !== null && String(v) !== '');
              const raw = values[0];
              if (raw === undefined) {
                missing.push(cf.field);
                continue;
              }
              // 剥离「编码.中文」的中文部分（写操作只认纯编码）
              head[cf.field] = typeof raw === 'string' && raw.includes('.') ? raw.split('.')[0] : raw;
            }
            if (missing.length > 0) {
              return {
                actual: `跳过（无法取样必填字段：${missing.join(', ')}）`,
                verdict: 'WARN',
                note: `create 必填字段 ${missing.join('/')} 在账套中无可用样本值，无法构造合法 create`,
              };
            }

            // 容器值必须为数组；容器名来自真机查证
            const input: Record<string, unknown> = { [obj.container]: [head] };

            const v = await session.callTool('yf_validate', {
              request: { type_key: obj.typeKey, operation: 'create', input },
            });
            if (v.parsed?.['success'] === false) {
              return {
                actual: `yf_validate 拒绝：${JSON.stringify(v.parsed['error'])}`,
                verdict: 'FAIL',
                note: '本地结构校验未通过',
              };
            }

            const call = await session.callTool('yf_run', {
              request: { type_key: obj.typeKey, operation: 'create', input },
            });
            // read 复核：以「记录真的落库」为唯一成功判据（不能只看 code）
            const rd = await session.callTool('yf_read', {
              type_key: obj.typeKey,
              datakeys: [{ [obj.primaryKey]: key }],
            });
            const real = countRealRecords(extractSuccessItems(rd.parsed));
            const msgs = extractErrorMessages(call.parsed);

            // ★ SDK 假成功防线：写操作 code=0 且 error[] 非空 → 抛 silent_business_error
            if (real === 0) {
              const sdkGuarded = call.parsed?.['success'] === false;
              if (sdkGuarded) {
                return {
                  actual:
                    `SDK 已拦截假成功（success=false）；read 有效记录=0，未落库。` +
                    `真实原因：${msgs[0] ?? '(无)'}`,
                  verdict: 'PASS',
                  note:
                    '符合预期：该对象 create 必填字段多（缺失清单见 error[].details），' +
                    '本轮只验证「假成功防线已生效」；补齐必填字段的正向用例见 post-mvp-master-create-fields。',
                };
              }
              recordDefect({
                id: `SILENT-CREATE-${obj.typeKey}`,
                title: `${obj.typeKey} create 返回 code=0「执行成功」但记录未落库（假成功防线未生效）`,
                detail:
                  `容器 ${obj.container}，主键 ${key}。create 的 execution.code="0"、description="执行成功"，` +
                  `但 parameter.result.success 为空数组，真实原因：${msgs.join(' | ')}。` +
                  'SDK 的 silent_business_error 防线本应拦截该形态却未生效 —— 属防线回归。',
                severity: 'blocker',
                scenario: `主数据/${obj.typeKey}/create`,
              });
              return {
                actual: `code=0 但未落库（read 有效记录=0）；真实原因：${msgs[0] ?? '(无)'}`,
                verdict: 'WARN',
                note: 'SDK 假成功防线未生效，已登记 blocker 缺陷（防线回归）。',
              };
            }
            createdKey = key;
            recordResidual(obj.typeKey, { [obj.primaryKey]: key }, '按既定策略不清理：create 成功后保留');
            return {
              actual: `create code=0；read 有效记录=${real}`,
              verdict: 'PASS',
              note: `新键 ${key} 已落库`,
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${obj.typeKey} / update 更改`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/update`,
            object: obj.typeKey,
            operation: 'update',
            expected: 'code=0 且 read 复核新值生效',
          },
          async () => {
            const session = await getSession();
            if (!createdKey) {
              return { actual: '跳过（create 未落库）', verdict: 'WARN', note: '该对象 create 未落库，无基线可改' };
            }
            const target = { [obj.primaryKey]: createdKey };
            const base = await session.callTool('yf_read', {
              type_key: obj.typeKey,
              datakeys: [target],
            });
            const node = extractSuccessItems(base.parsed)[0] ?? {};
            const baseline = firstNodePayload(node) ?? target;

            // ⚠️ update 必须按**官方样本白名单**下发（真机取证 2026-10-10）：
            //   read 的全量字段（customer 140 / supplier 109 / item 151 / warehouse 45 个）
            //   原样回传会被拒，报错 data 点名只读字段或需转码的枚举：
            //     「不可修改!」           → valid_status / inventory_qty / export_code 等系统字段
            //     「输入的信息不符合范围!」 → 枚举回参是「编码.中文」，update 只认**纯编码**
            const payload: Record<string, unknown> = {};
            for (const f of obj.updateWhitelist) {
              if (f in baseline) payload[f] = baseline[f];
            }
            // 枚举转纯编码：剥掉「编码.中文」的中文部分
            for (const [k, v] of Object.entries(payload)) {
              if (typeof v === 'string' && /^[A-Za-z0-9_]*\./.test(v)) {
                payload[k] = v.split('.')[0];
              }
            }
            payload[obj.updateField] = obj.updateValue;
            const input: Record<string, unknown> = { [obj.container]: [payload] };

            const call = await session.callTool('yf_run', {
              request: { type_key: obj.typeKey, operation: 'update', input },
            });
            const ok = isSuccessEnvelope(call.parsed) || call.parsed?.['success'] === true;
            if (!ok) {
              const msgs = extractErrorMessages(call.parsed);
              return { actual: `update 失败：${msgs[0] ?? call.text.slice(0, 200)}`, verdict: 'FAIL', note: '' };
            }

            const rd = await session.callTool('yf_read', {
              type_key: obj.typeKey,
              datakeys: [target],
            });
            const after = firstNodePayload(extractSuccessItems(rd.parsed)[0] ?? {}) ?? {};
            const got = after[obj.updateField];
            return {
              actual: `${obj.updateField} = ${JSON.stringify(got)}`,
              verdict: got === obj.updateValue ? 'PASS' : 'WARN',
              note: got === obj.updateValue ? `官方白名单（${obj.updateWhitelist.length} 字段）+ 枚举纯编码路径已验证` : `期望 ${obj.updateValue}，实测 ${JSON.stringify(got)}`,
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${obj.typeKey} / delete 删除`, async () => {
        const r = await runScenario(
          {
            scenario: `主数据/${obj.typeKey}/delete`,
            object: obj.typeKey,
            operation: 'delete',
            expected: 'code=0',
          },
          async () => {
            const session = await getSession();
            if (!createdKey) {
              return { actual: '跳过（create 未落库）', verdict: 'WARN', note: '该对象 create 未落库（假成功防线已正常拦截），无基线可删；正向 create 见 post-mvp-master-create-fields' };
            }
            const call = await session.callTool('yf_run', {
              request: {
                type_key: obj.typeKey,
                operation: 'delete',
                input: { datakeys: [{ [obj.primaryKey]: createdKey }] },
              },
            });
            const ok = isSuccessEnvelope(call.parsed) || call.parsed?.['success'] === true;
            return {
              actual: ok
                ? 'delete code=0'
                : `delete 失败：${extractErrorMessages(call.parsed)[0] ?? call.text.slice(0, 200)}`,
              verdict: ok ? 'PASS' : 'FAIL',
              note: ok ? `已删除新键 ${createdKey}` : '删除被拒（非预期）',
            };
          },
        );
        assertNotFailed(r);
      });
    });
  }
});

// 本文件全部用例跑完后写出侧车结果，供报告生成器汇总（跨文件进程隔离）
afterAll(() => {
  // RUN-DROPS-ENVELOPE 已于 2026-10-10 修复（yf_run 新增 describeRunError），
  // 故不再登记为缺陷；回归防护由 yfcli-sdk 的「假成功防线」单测承担。
  writeSidecar('crud-master', {
    scenarios: scenarioResults,
    residual: residualRecords as unknown as Array<Record<string, unknown>>,
    defects: defectRecords as unknown as Array<Record<string, unknown>>,
  });
});
