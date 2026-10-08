/**
 * 响应解析 —— 两条数据通道 + 双结构 error[] 兼容。
 *
 * 关键实测约束：
 * 1. 必须先判 HTTP 状态码：错误 token 返回 500 + HTML，解析 body 会抛未捕获异常。
 * 2. `code === "0" || code === "-0"` 才算成功，**禁止字符串匹配 description**
 *    （成功文案繁简混用，实测恒为繁体「查詢成功」，文档却写「执行成功」）。
 * 3. 查询类走 `parameter.result.rows`，主键类走 `parameter.result.success`，
 *    是两条不同通道，不可混用。
 * 4. `error[]` 双结构，未识别须抛 YfError（kind=unknown_error_item），不得静默吞掉。
 * 5. `error[].data` 会回显传入数据，日志前必须脱敏。
 */

import type {
  YfErrorEntry,
  YfErrorContext,
} from '../types/errors.js';
import { YfError, isYfErrorDataCarrier } from '../types/errors.js';
import type {
  YfActionResult,
  YfQueryResult,
} from '../types/domain.js';
import type {
  YfExecution,
  YfResponseEnvelope,
  YfResponseParameter,
  YfResultBlock,
  YfRow,
} from '../types/protocol.js';
import { YF_SUCCESS_CODES } from '../types/protocol.js';
import { explainMisleadingAuthMessage } from '../config/headers.js';

// ------------------------------------------------------------------ 封包解析

/** 判定execution.code 是否为成功。 */
export function isSuccessCode(code: string): boolean {
  return (YF_SUCCESS_CODES as readonly string[]).includes(code);
}

/**
 * 把未收敛的 JSON 收敛为 YfResponseEnvelope。
 *
 * 只做结构存在性判定，不改写内容。结构不符即抛 protocol 层错误 ——
 * 这类错误说明 SDK 与服务端协议已脱节，属严重问题，不能降级处理。
 */
export function parseEnvelope(body: unknown): YfResponseEnvelope {
  if (typeof body !== 'object' || body === null) {
    throw new YfError({
      layer: 'protocol',
      kind: 'malformed_response',
      message:
        '响应体不是 JSON 对象。易飞在令牌无效时返回 HTTP 500 + HTML 错误页，' +
        '若此处出现，说明调用方未先判HTTP 状态码。',
    });
  }

  const stdData = (body as Record<string, unknown>)['std_data'];
  if (typeof stdData !== 'object' || stdData === null) {
    throw new YfError({
      layer: 'protocol',
      kind: 'malformed_response',
      message: '响应缺少 std_data 根标签，不符合易飞固定封包 std_data → parameter 约定',
    });
  }

  const executionRaw = (stdData as Record<string, unknown>)['execution'];
  if (typeof executionRaw !== 'object' || executionRaw === null) {
    throw new YfError({
      layer: 'protocol',
      kind: 'malformed_response',
      message: '响应缺少 std_data.execution，无法判定调用成败',
    });
  }

  const execution = readExecution(executionRaw);
  const parameterRaw = (stdData as Record<string, unknown>)['parameter'];
  const parameter =
    typeof parameterRaw === 'object' && parameterRaw !== null
      ? (parameterRaw as YfResponseParameter)
      : undefined;

  return {
    std_data: parameter === undefined
      ? { execution }
      : { execution, parameter },
  };
}

function readExecution(raw: object): YfExecution {
  const rec = raw as Record<string, unknown>;
  const code = rec['code'];
  if (typeof code !== 'string') {
    throw new YfError({
      layer: 'protocol',
      kind: 'malformed_response',
      message:
        'execution.code 缺失或非字符串。实测该字段仅 "0"（成功）与 "-1"（失败）两种取值，' +
        '缺失说明响应结构异常，不可默认为成功',
    });
  }
  const sqlCode = rec['sql_code'];
  const description = rec['description'];
  return {
    code,
    sql_code: typeof sqlCode === 'string' ? sqlCode : '',
    description: typeof description === 'string' ? description : '',
  };
}

// ------------------------------------------------------------------ 业务失败

/**
 * 业务失败归类。
 *
 * 归类依据是错误文案中的稳定片段 —— 注意这与「用 description 判定成功」
 * 是两回事：成功判定**只能**看 code，失败归类则允许看文案以提升可诊断性。
 */
function classifyBusinessError(message: string): YfError['kind'] {
  const normalized = message.replace(/\s+/g, '');
  if (normalized.includes('无效的身份令牌') || normalized.includes('无效身份令牌')) {
    return 'token_invalid';
  }
  if (normalized.includes('digi-datakey')) return 'datakey_invalid';
  if (normalized.includes('Can not found CompanyId')) return 'company_not_found';
  if (normalized.includes('MA012')) return 'node_not_registered';
  if (normalized.includes('找不到資料表') || normalized.includes('找不到资料表')) {
    return 'field_not_found';
  }
  if (normalized.includes('conditions not found')) return 'conditions_invalid';
  if (normalized.includes('datakeys is not valid')) return 'datakeys_invalid';
  if (normalized.includes('的鍵值參數') || normalized.includes('的键值参数')) {
    return 'primary_key_missing';
  }
  if (normalized.includes('没有权限') || normalized.includes('沒有權限')) {
    return 'permission_denied';
  }
  if (normalized.includes('ExecSQL Error') || normalized.includes('PRIMARY KEY')) {
    return 'exec_sql_error';
  }
  return 'service_not_registered';
}

/** 解析 `error[]`，兼容结构 A（`{message,data}`）与结构 B（`{information[]}`）。 */
export function parseErrorEntries(parameter: YfResponseParameter | undefined): YfErrorEntry[] {
  const rawItems = parameter?.result?.error;
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  const entries: YfErrorEntry[] = [];
  const unrecognized: unknown[] = [];

  for (const item of rawItems) {
    if (!isYfErrorDataCarrier(item)) {
      unrecognized.push(item);
      continue;
    }
    const rec = item as unknown as Record<string, unknown>;
    if (typeof rec['message'] === 'string') {
      const data = rec['data'];
      entries.push(data === undefined
        ? { message: rec['message'] }
        : { message: rec['message'], data });
      continue;
    }
    const infoList = rec['information'];
    if (Array.isArray(infoList)) {
      for (const inner of infoList) {
        if (typeof inner !== 'object' || inner === null) {
          unrecognized.push(inner);
          continue;
        }
        const innerRec = inner as Record<string, unknown>;
        const msg = innerRec['message'];
        if (typeof msg !== 'string') {
          unrecognized.push(inner);
          continue;
        }
        const data = innerRec['data'];
        entries.push(data === undefined ? { message: msg } : { message: msg, data });
      }
      continue;
    }
    unrecognized.push(item);
  }

  if (unrecognized.length > 0) {
    // 「错误被静默吞掉」的唯一防线在此：未识别结构必须显式失败。
    throw new YfError({
      layer: 'business',
      kind: 'unknown_error_item',
      message:
        `error[] 中有 ${unrecognized.length} 项结构无法识别（既非 {message,data} ` +
        '也非 {information:[...]}）。这意味着易飞可能新增了第三种错误结构，' +
        '继续解析会丢错误信息。请把原始结构报给后端维护者。',
      rawData: unrecognized,
      details: entries,
    });
  }

  return entries;
}

/** 业务层失败（code=-1）时构造错误。 */
export function buildBusinessError(
  envelope: YfResponseEnvelope,
  context?: YfErrorContext,
): YfError {
  const { execution, parameter } = envelope.std_data;
  const details = parseErrorEntries(parameter);
  const primaryMessage = details[0]?.message ?? execution.description;

  const misleading = explainMisleadingAuthMessage(execution.description);
  const message =
    (misleading !== undefined ? `${misleading}（服务端原文：${execution.description}）` : primaryMessage) ||
    '易飞返回 code=-1 但未提供错误文案';

  return new YfError({
    layer: 'business',
    kind: classifyBusinessError(primaryMessage),
    message,
    description: execution.description,
    details,
    rawData: details.length > 0 ? details : undefined,
    ...(context ? { context } : {}),
  });
}

// ------------------------------------------------------------------ 数据通道

/** 解析查询类结果（`parameter.result.rows` 通道）。 */
export function parseQueryResult(parameter: YfResponseParameter | undefined): YfQueryResult {
  const rows = readRows(parameter?.result);
  const totalRaw = parameter?.total_result;
  const hasNext = parameter?.has_next;
  const cnt = parameter?.result?.cnt;

  return {
    rows,
    ...(typeof totalRaw === 'number' ? { totalResult: totalRaw } : {}),
    hasNext: typeof hasNext === 'boolean' ? hasNext : false,
    count: typeof cnt === 'number' ? cnt : rows.length,
  };
}

/**
 * 解析主键类结果（`parameter.result.success` 通道）。
 *
 * `empty` 为 true 表示「code=0 但无数据」，等价于查无此单，
 * 上层必须告警 —— 主键全错时易飞正是返回 code=0 + 空数组。
 */
export function parseActionResult(
  parameter: YfResponseParameter | undefined,
  serviceName: string,
  context?: YfErrorContext,
): YfActionResult {
  const success = parameter?.result?.success;
  const items = Array.isArray(success) ? success : [];
  if (items.length > 0) {
    return { items, empty: false, serviceName };
  }
  // 空结果不抛错，但必须让调用方看见：静默返回会掩盖「主键写错」。
  void context;
  return { items, empty: true, serviceName };
}

/** 空结果告警的文案生成。独立成函数以便测试与复用。 */
export function describeEmptyResultWarning(
  serviceName: string,
  primaryKeyHint: readonly string[],
): string {
  const pk = primaryKeyHint.length > 0 ? primaryKeyHint.join(' + ') : '<未知主键>';
  return (
    `${serviceName} 返回 code=0 但数据为空数组。` +
    `实测：主键（${pk}）全部写错时易飞同样返回 code=0 + 空数组，不报错。` +
    '因此空结果既可能是「条件确实无匹配」，也可能是「主键写错」，不得当作成功静默吞掉。'
  );
}

/** 取出 rows 数组，非数组时返回空数组（缺 rows 说明走了另一条通道）。 */
function readRows(result: YfResultBlock | undefined): readonly YfRow[] {
  const rows = result?.rows;
  return Array.isArray(rows) ? rows : [];
}