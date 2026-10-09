/**
 * HTTP 错误分类器。
 *
 * 核心规则（AGENTS.md §真机实测硬约束 #3 + #5）：
 * - HTTP 500 + HTML body → TokenInvalidError（不解析 body）。
 * - HTTP 401/403 → TokenExpiredError。
 * - 其他 → ErpConnectionError。
 * - 先判 HTTP 状态码，非 200 走独立分支，不要解析 body。
 *
 * 为什么 500+HTML 是 token 问题而非服务端崩溃：
 * 易飞在 token 错误时返回 HTTP 500 + HTML 错误页（不是 JSON），
 * 这与标准 REST 语义不符，但已是确认行为。
 */

import {
  ErpConnectionError,
  TokenExpiredError,
  TokenInvalidError,
} from './types.js';

/** HTTP 错误分类结果。 */
export interface ClassifiedError {
  /** 分类后的错误实例。 */
  readonly error: TokenExpiredError | TokenInvalidError | ErpConnectionError;
  /** 原始 HTTP 状态码。 */
  readonly statusCode: number;
  /** 是否为 HTML 响应体。 */
  readonly isHtmlBody: boolean;
}

/**
 * 判断响应体是否为 HTML。
 * 简单启发式：以 < 开头或包含 <!DOCTYPE / <html。
 */
export function isHtmlResponse(body: string): boolean {
  const trimmed = body.trimStart();
  return (
    trimmed.startsWith('<!') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<HTML') ||
    trimmed.includes('<!DOCTYPE') ||
    trimmed.includes('<!doctype')
  );
}

/**
 * 分类 HTTP 错误。
 *
 * @param statusCode HTTP 状态码。
 * @param body       响应体文本（可能为 HTML 或 JSON 字符串）。
 *                   **注意**：实际实现中不会尝试解析 JSON body 的内容。
 *
 * @returns 分类后的错误对象、*关键！body  * 从文本内容上判断是不是 html 标签
 */
export function classifyHttpError(statusCode: number, body: string): ClassifiedError {
  const htmlBody = isHtmlResponse(body);

  // HTTP 500 + HTML → token invalid（易飞特殊行为）
  if (statusCode === 500 && htmlBody) {
    return {
      error: new TokenInvalidError(
        'ERP 返回 HTTP 500 + HTML 页面，token 大概率无效',
        statusCode,
      ),
      statusCode,
      isHtmlBody: true,
    };
  }

  // HTTP 401/403 → token expired
  if (statusCode === 401 || statusCode === 403) {
    return {
      error: new TokenExpiredError(
        `HTTP ${statusCode}: Token 过期或权限不足`,
      ),
      statusCode,
      isHtmlBody: htmlBody,
    };
  }

  // HTTP 500 + JSON → 注意区分
  if (statusCode === 500) {
    return {
      error: new ErpConnectionError(
        'ERP 返回 HTTP 500，可能是服务端错误或 token 问题',
        statusCode,
      ),
      statusCode,
      isHtmlBody: false,
    };
  }

  // 其他状态码 → 通用连接错误
  return {
    error: new ErpConnectionError(
      `HTTP ${statusCode}: ERP 请求失败`,
      statusCode,
    ),
    statusCode,
    isHtmlBody: htmlBody,
  };
}

/**
 * 从 fetch/HTTP 客户端响应中提取并分类错误。
 * 便捷入口：传入 Response-like 对象，返回结构化错误。
 */
export async function classifyHttpResponse(
  response: { status: number; text: () => Promise<string> },
): Promise<ClassifiedError> {
  const body = await response.text();
  return classifyHttpError(response.status, body);
}
