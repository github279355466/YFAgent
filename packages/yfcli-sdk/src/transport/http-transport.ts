/**
 * HTTP 传输层 —— 唯一发起网络请求的地方。
 *
 * 与易助的三点差异（均来自真机实测）：
 * 1. **先判HTTP 状态码**，非 200 走独立分支，禁止尝试解析 body 为 JSON。
 *    错误 token 返回 500 + `text/html; charset=gb2312`，解析必然抛异常。
 * 2. URL 路径大小写敏感，由 config 层拼接常量，此处不做任何改写。
 * 3. 无 fastquery，所有查询重查数据库，因此不隐藏延迟信息，日志须记录 elapsed。
 */

import type { ResolvedRuntimeConfig } from '../types/config.js';
import type { YfErrorContext } from '../types/errors.js';
import { YfError, httpError } from '../types/errors.js';
import { buildHeaders } from '../config/headers.js';
import type { YfRequestEnvelope } from '../types/protocol.js';

/** 原始 HTTP 响应（未解析业务语义）。 */
export interface YfHttpResponse {
  readonly status: number;
  readonly bodyText: string;
  readonly elapsedMs: number;
  /** 非 200 时的响应体前若干字符，供错误提示。 */
  readonly preview: string;
}

/** 预览长度：足够看出是 HTML 错误页还是 JSON，又不至于把整页塞进日志。 */
const BODY_PREVIEW_LIMIT = 200;

/**
 * 传输接口。
 *
 * 抽成接口的原因：单元测试需要可替换的传输实现，
 * 真机验证脚本也需注入自定义行为（如强制 page_size 上限）。
 */
export interface YfTransport {
  post(
    config: ResolvedRuntimeConfig,
    serviceName: string,
    envelope: YfRequestEnvelope,
    context?: YfErrorContext,
  ): Promise<YfHttpResponse>;
}

/** 基于 globalThis.fetch 的传输实现。 */
export class FetchTransport implements YfTransport {
  public async post(
    config: ResolvedRuntimeConfig,
    serviceName: string,
    envelope: YfRequestEnvelope,
    context?: YfErrorContext,
  ): Promise<YfHttpResponse> {
    const headers = buildHeaders(config, serviceName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        // 转为普通对象：YfRequestHeaders 用 readonly 精确键类型声明，
        // 与 fetch 的 HeadersInit 索引签名不兼容，此处做一次显式摊平。
        headers: { ...headers },
        body: JSON.stringify(envelope),
        signal: controller.signal,
      });
      const bodyText = await response.text();
      const elapsedMs = Date.now() - startedAt;

      return {
        status: response.status,
        bodyText,
        elapsedMs,
        preview: bodyText.slice(0, BODY_PREVIEW_LIMIT),
      };
    } catch (cause) {
      const elapsedMs = Date.now() - startedAt;
      throw wrapTransportFailure(cause, serviceName, elapsedMs, context);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * 把传输层异常包装为 YfError。
 *
 * AbortError 与 DNS/连接失败需区分：前者是超时（可重试），
 * 后者是环境问题（重试无意义）。
 */
function wrapTransportFailure(
  cause: unknown,
  serviceName: string,
  elapsedMs: number,
  context?: YfErrorContext,
): YfError {
  const message = cause instanceof Error ? cause.message : String(cause);
  const isAbort =
    cause instanceof Error &&
    (cause.name === 'AbortError' || cause.name === 'TimeoutError');

  const enriched: YfErrorContext = {
    serviceName,
    elapsedMs,
    ...(context ?? {}),
  };

  if (isAbort) {
    return new YfError({
      layer: 'transport',
      kind: 'timeout',
      message:
        `请求超时。易飞侧接口级超时时间文档未说明，此处为工程取值。` +
        `服务 ${serviceName}，已耗时 ${elapsedMs}ms。`,
      context: enriched,
    });
  }

  return new YfError({
    layer: 'transport',
    kind: 'http_unexpected',
    message:
      `网络请求失败：${message}。` +
      '请确认目标在内网可达（易飞 OpenAPI 通常仅内网暴露），' +
      '并检查是否误走了 HTTP 代理。',
    context: enriched,
  });
}

/**
 * 校验 HTTP 状态码，非 200 立即抛错。
 *
 * 必须独立成函数并在解析 body 之前调用 —— 这是易飞侧最易踩的坑。
 */
export function assertHttpOk(response: YfHttpResponse, context?: YfErrorContext): void {
  if (response.status === 200) return;

  const enriched: YfErrorContext = {
    elapsedMs: response.elapsedMs,
    ...(context ?? {}),
  };
  throw httpError(response.status, response.preview, enriched);
}