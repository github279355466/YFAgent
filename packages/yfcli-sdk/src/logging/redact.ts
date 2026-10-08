/**
 * 日志脱敏 —— 阻断 `error[].data` 回显泄漏。
 *
 * 实测：易飞 `error[].data` 会**完整回显传入的出错数据**。
 * 例如主键缺失场景会回传 `{"doc_type_no":"091W"}`；
 * create 主键冲突场景会回传整个 `customer_basic_data_file_data` 实体。
 *
 * 若原样落盘，等于把业务单据内容写进日志系统，且不可撤回。
 */

/**
 * 需要脱敏的键名（小写匹配）。
 *
 * 同时收录连字符与下划线两种写法：`digi-user-token` 是易飞真实头名，
 * 但业务代码里常以 `digi_user_token` 落库/落日志，两种都要拦。
 */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'digi-service',
  'digi-user-token',
  'digi_user_token',
  'digi-datakey',
  'digi_datakey',
  'token',
  'user_token',
  'usertoken',
  'authorization',
  'password',
  'passwd',
  'pwd',
  'secret',
  'companyidraw',
]);

/** 命中即整体脱敏的值形态（令牌为 48 位十六进制串）。 */
const TOKEN_LIKE = /^[0-9A-Fa-f]{32,}$/;

/**
 * 长数字串（单号/流水号），保留前 3 后 3 位。
 *
 * 只处理纯数字：短业务编码（如 8 位字母数字混排的客户码）**不脱敏**，
 * 因为它们是排障必需信息。脱敏的目标是「令牌与凭据」以及「超长数字标识」，
 * 不是「一切看起来像编码的字符串」—— 全量脱敏会让日志失去排障价值。
 */
const LONG_DIGIT = /^\d{9,}$/;

export interface YfRedactOptions {
  /** 字符串超过该长度时截断，默认 200。 */
  readonly maxStringLength?: number;
  /** 递归最大深度，超出即以占位符替代，默认 6。 */
  readonly maxDepth?: number;
  /** 数组最大保留项数，默认 20。 */
  readonly maxArrayItems?: number;
}

const DEFAULT_OPTIONS: Required<YfRedactOptions> = {
  maxStringLength: 200,
  maxDepth: 6,
  maxArrayItems: 20,
};

/**
 * 递归脱敏任意结构。返回新对象，不修改入参。
 *
 * 覆盖三种泄漏途径：
 * 1. 键名命中敏感词 -> 值整体替换
 * 2. 值为令牌形态 -> 掩码
 * 3. 值为长数字串 -> 部分掩码（单号仍可辨识但不全量落盘）
 */
export function redact(value: unknown, options: YfRedactOptions = {}): unknown {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return walk(value, 0, opts);
}

function walk(value: unknown, depth: number, opts: Required<YfRedactOptions>): unknown {
  if (depth > opts.maxDepth) return '<深度超限，已截断>';

  if (typeof value === 'string') return maskString(value, opts.maxStringLength);
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    const kept = value.slice(0, opts.maxArrayItems).map((item) => walk(item, depth + 1, opts));
    if (value.length > opts.maxArrayItems) {
      kept.push(`<另有 ${value.length - opts.maxArrayItems} 项未展开>`);
    }
    return kept;
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '<已脱敏>';
      continue;
    }
    out[key] = walk(item, depth + 1, opts);
  }
  return out;
}

function maskString(text: string, maxLength: number): string {
  if (TOKEN_LIKE.test(text)) {
    return `${text.slice(0, 3)}***${text.slice(-3)}`;
  }
  if (LONG_DIGIT.test(text)) {
    return `${text.slice(0, 3)}***${text.slice(-3)}`;
  }
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...<已截断，原长 ${text.length}>`;
}

/**
 * 脱敏错误回显数据，供日志使用。
 *
 * YfError.rawData 是`unknown`，可能是对象、数组或字符串，
 * 此处统一走 redact 后再返回，调用方无需判断形态。
 */
export function redactErrorData(rawData: unknown): unknown {
  return redact(rawData);
}

/** 令牌掩码，供日志头部展示。 */
export function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.slice(0, 3)}***${token.slice(-3)}`;
}