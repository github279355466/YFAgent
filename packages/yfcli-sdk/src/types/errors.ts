/**
 * 错误模型 —— 四层错误分层，与 docs/plans/yf-openapi-rules.md §8 对齐。
 *
 * 关键实测约束（决定了本文件的结构）：
 * 1. 错误 token 返回 **HTTP 500 + HTML 错误页**，不是 JSON。
 *    → 必须先判HTTP 状态码，非 200 走独立分支，**禁止**尝试解析 body 为 JSON。
 * 2. `error[]` 有两种结构，未识别形态须抛错而非吞掉。
 * 3. `error[].data` 会回显传入数据，日志落盘前必须脱敏。
 */

import type { YfErrorDataCarrier } from './protocol.js';

/** 错误层级。判定顺序即处置顺序，不可颠倒。 */
export type YfErrorLayer =
  /** 传输层：连接失败、超时、DNS。 */
  | 'transport'
  /** HTTP 层：状态码非 200。错误 token 即落在此层（500 + HTML）。 */
  | 'http'
  /** 协议层：200 但 body 不是可识别的易飞封包（缺 std_data / execution）。 */
  | 'protocol'
  /** 业务层：`execution.code` 为 '-1'。 */
  | 'business'
  /** 数据层：`code=0` 但数据为空等静默错误特征。 */
  | 'silent';

/** 错误归类。用于调用方决定重试策略与是否上抛。 */
export type YfErrorKind =
  /** 令牌无效或缺失。真机文案：`无效的身份令牌,请检查是否传入身份令牌.` */
  | 'token_invalid'
  /** `digi-datakey` 相关。缺失文案：`digi-datakey is not valid.` */
  | 'datakey_invalid'
  /** 账套不存在。文案含 `Can not found CompanyId(xxx) in DSCMB`。 */
  | 'company_not_found'
  /** 服务名未在服务端注册。注意空服务名会被误报为「无效身份令牌」。 */
  | 'service_not_registered'
  /** `conditions` 结构不合法。文案：`conditions not found.` */
  | 'conditions_invalid'
  /** `datakeys` 结构不合法。文案：`datakeys is not valid.` */
  | 'datakeys_invalid'
  /** 缺少主键键值。文案：`缺少[doc_no]的鍵值參數`。 */
  | 'primary_key_missing'
  /** 节点名未在 OAPMA 注册表登记。文案：`MA012未定義`。 */
  | 'node_not_registered'
  /** 节点名正确但字段名不对。文案：`找不到資料表:[XXX]`。 */
  | 'field_not_found'
  /** 权限不足。文案形如「该用户XXX没有权限」。 */
  | 'permission_denied'
  /** 服务端执行异常（如唯一键冲突）。 */
  | 'exec_sql_error'
  /** 响应封包不符合易飞协议。 */
  | 'malformed_response'
  /** 传输超时或连接中断。 */
  | 'timeout'
  /** HTTP 非 200，且响应体非 HTML 错误页（无法归入已知类别）。 */
  | 'http_unexpected'
  /** `code=0` 但结果为空 —— 静默错误，须告警而非当成功。 */
  | 'empty_result'
  /** 枚举值形态可疑（传入 `编码.中文` 形态）。 */
  | 'enum_code_suspect'
  /** 命中未识别的 `error[]` 结构。 */
  | 'unknown_error_item';

/**
 * SDK 统一错误。
 *
 * 设计要点：
 * - `layer` 与 `kind` 分离：前者回答「哪一层出的问题」，后者回答「什么问题」。
 * - `rawData` 保留原始回显但**不保证已脱敏**，落盘前必须显式调用 redactErrorData。
 * - 错误消息为纯文本，**不含任何 emoji 或装饰符号**。
 */
export class YfError extends Error {
  public readonly layer: YfErrorLayer;
  public readonly kind: YfErrorKind;
  /** HTTP 状态码；仅 http 层有值。 */
  public readonly httpStatus?: number;
  /** `execution.description` 原文（业务层）。 */
  public readonly description?: string;
  /** 归一化后的错误明细（业务层/数据层）。未提供时为空数组，不为 undefined。 */
  public readonly details: readonly YfErrorEntry[];
  /** 原始回显数据，**可能含敏感业务数据**，落盘前必须脱敏。 */
  public readonly rawData?: unknown;
  /** 触发本次错误的调用上下文（服务名 / type_key / operation），用于日志追溯。 */
  public readonly context?: YfErrorContext;

  public constructor(init: YfErrorInit) {
    super(init.message);
    this.name = 'YfError';
    this.layer = init.layer;
    this.kind = init.kind;
    if (init.httpStatus !== undefined) this.httpStatus = init.httpStatus;
    if (init.description !== undefined) this.description = init.description;
    this.details = init.details ?? [];
    if (init.rawData !== undefined) this.rawData = init.rawData;
    if (init.context !== undefined) this.context = init.context;
  }
}

export interface YfErrorInit {
  readonly layer: YfErrorLayer;
  readonly kind: YfErrorKind;
  readonly message: string;
  readonly httpStatus?: number;
  readonly description?: string;
  readonly details?: readonly YfErrorEntry[];
  readonly rawData?: unknown;
  readonly context?: YfErrorContext;
}

/** 归一化后的单条错误明细。 */
export interface YfErrorEntry {
  /** 易飞返回的中文错误消息。 */
  readonly message: string;
  /** 该条错误对应的回显数据，未脱敏。 */
  readonly data?: unknown;
}

/** 错误上下文，用于日志定位。不含任何凭据。 */
export interface YfErrorContext {
  readonly serviceName?: string;
  readonly typeKey?: string;
  readonly operation?: string;
  readonly elapsedMs?: number;
}

/** 便捷构造：HTTP 层错误。 */
export function httpError(status: number, bodyPreview: string, context?: YfErrorContext): YfError {
  const kind: YfErrorKind = status === 500 ? 'token_invalid' : 'http_unexpected';
  const hint =
    status === 500
      ? 'HTTP 500 通常为令牌无效（易飞对错误 token 返回 500 + HTML 错误页，勿尝试解析 JSON）'
      : `服务端返回 HTTP ${status}`;
  return new YfError({
    layer: 'http',
    kind,
    message: `${hint}。响应体前 200 字符：${bodyPreview}`,
    httpStatus: status,
    rawData: bodyPreview,
    ...(context ? { context } : {}),
  });
}

/** 便捷构造：静默错误（code=0 但数据为空）。 */
export function emptyResultError(
    message: string,
    context?: YfErrorContext,
  ): YfError {
  return new YfError({
    layer: 'silent',
    kind: 'empty_result',
    message,
    ...(context ? { context } : {}),
  });
}

/** 类型守卫：是否为 YfError。 */
export function isYfError(value: unknown): value is YfError {
  return value instanceof YfError;
}

/** 类型守卫：是否为未识别的 error[] 项。 */
export function isYfErrorDataCarrier(value: unknown): value is YfErrorDataCarrier {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec['message'] === 'string' || Array.isArray(rec['information']);
}