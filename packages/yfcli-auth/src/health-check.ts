/**
 * ERP 连通性健康检查。
 *
 * 独立可执行，不依赖 SDK client。
 * 向 ERP 发一个轻量请求验证连通性，返回结构化结果。
 *
 * 设计约束：
 * - 使用 Node.js 原生 fetch（Node 18+），不引入额外 HTTP 库。
 * - 超时由 AbortController 控制。
 * - 失败时返回 { ok: false }，不抛异常（调用方决定如何处理）。
 */

import type { HealthCheckResult } from './types.js';

/** 健康检查使用的最轻服务名。选一个只读、无副作用的服务。 */
const HEALTH_SERVICE_NAME = 'yf.oapi.company.query.get';

/** 健康检查请求体（最小合法结构）。 */
function buildHealthRequestBody(companyId: string): string {
  return JSON.stringify({
    std_data: {
      parameter: {
        conditions: {
          operator: 'AND',
          fields: [],
        },
        page_no: 1,
        page_size: 1,
      },
    },
  });
}

/** 易飞 OpenAPI 固定路径。 */
const YF_ENDPOINT_PATH = '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

/**
 * 检查 ERP 连通性。
 *
 * @param baseUrl   ERP 基础 URL（不含路径）。
 * @param companyId 公司别编号。
 * @param token     用户令牌。
 * @param timeoutMs 超时毫秒数。
 * @returns 结构化检查结果。永远不抛异常。
 */
export async function checkErpConnectivity(
  baseUrl: string,
  companyId: string,
  token: string,
  timeoutMs: number,
): Promise<HealthCheckResult> {
  // P0-8: 空 token 短路，不发网络请求
  if (!token) {
    return { ok: false, latencyMs: 0, error: "缺少用户令牌（token 为空）" };
  }

  const url = baseUrl.replace(/\/+$/, '') + YF_ENDPOINT_PATH;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'digi-service': JSON.stringify({ name: HEALTH_SERVICE_NAME }),
        'digi-user-token': token,
        'digi-datakey': JSON.stringify({ CompanyId: companyId }),
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: buildHealthRequestBody(companyId),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      // P0-7: HTTP 200 不等于业务成功，需解析 execution.code
      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        const execCode = parsed?.std_data?.execution?.code;
        if (execCode !== undefined && String(execCode) !== "0" && String(execCode) !== "-0") {
          const desc = parsed?.std_data?.execution?.description ?? "";
          return {
            ok: false,
            latencyMs,
            error: `ERP 业务错误 (code=${execCode}): ${desc}`,
          };
        }
        return { ok: true, latencyMs, error: undefined };
      } catch {
        // body 解析失败但 HTTP 200 —— 至少网络通了，视为连通
        return { ok: true, latencyMs, error: undefined };
      }
    }

    // 非 200 但不一定是连接问题 —— 至少网络通了
    return {
      ok: false,
      latencyMs,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        latencyMs: timeoutMs,
        error: `健康检查超时（${timeoutMs}ms）`,
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs,
      error: `连接失败: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
