/**
 * yf_run —— 通用 ERP 操作执行器。
 *
 * 两种模式：
 *   1) type_key + operation：查 typekey_map 获取服务名 → 调用 SDK client
 *   2) service：直接用服务名调用（用于 AI 助手端点 yf.ai.*）
 *
 * 适配易飞请求体格式：容器名直接在 parameter 下，不用 cdsMaster。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import type { YfOperation, ResolvedRuntimeConfig } from 'yfcli-sdk';
import { buildHeaders } from 'yfcli-sdk';

const VALID_OPERATIONS = [
  'query', 'read', 'create', 'update', 'delete',
  'approve', 'disapprove', 'invalid',
] as const;

interface RunParams {
  request: {
    type_key?: string;
    operation?: string;
    service?: string;
    input?: Record<string, unknown>;
  };
}

/**
 * 把异常收敛为可诊断的错误对象。
 *
 * 背景（2026-10-10 真机事故）：yf_run 此前只回 `api_error.message`，
 * 把 ERP 响应信封整个丢掉 —— 调用方看不到 `error[].information[].data`
 * 里「哪个字段不可空白」的关键线索，只看到一句笼统的失败文案。
 * 本函数把 SDK YfError 的结构化字段（kind / description / details）摊平出来。
 */
function describeRunError(err: unknown): Record<string, unknown> {
  const message = err instanceof Error ? err.message : String(err);
  const base: Record<string, unknown> = { type: 'api_error', message };

  // SDK 的 YfError 带结构化字段；非 YfError 时退化为纯 message。
  const yfErr = err as {
    kind?: unknown;
    layer?: unknown;
    description?: unknown;
    details?: unknown;
  };
  if (typeof yfErr?.kind === 'string') base['kind'] = yfErr.kind;
  if (typeof yfErr?.layer === 'string') base['layer'] = yfErr.layer;
  // ERP 原文 description 保留：失败归类允许看文案（成功判定则只看 code）。
  if (typeof yfErr?.description === 'string' && yfErr.description !== '') {
    base['erp_description'] = yfErr.description;
  }
  if (Array.isArray(yfErr?.details) && yfErr.details.length > 0) {
    base['erp_errors'] = yfErr.details;
  }
  return base;
}

async function handleRun(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as RunParams;
  const request = typed.request;

  if (!request) {
    return { error: '缺少必填参数 request' };
  }

  const mode = request.service ? 'direct' : 'standard';

  // ---- Direct service 模式 ----
  if (mode === 'direct') {
    const serviceName = request.service!;
    const input = request.input ?? {};

    try {
      // 直接通过 transport 发送，绕过 catalog 查表
      const envelope = { std_data: { parameter: input } };

      // 访问 client 内部 config 和 transport（SDK 未暴露 public API）
      const clientAny = context.client as unknown as {
        config: ResolvedRuntimeConfig;
        transport: { post: (...args: unknown[]) => Promise<{ status: number; bodyText: string }> };
      };

      const config = clientAny.config;
      const endpoint = config.endpoint;

      // 用 SDK 的 buildHeaders 构造四头 —— 绝不手写。
      // 手写踩过的坑（2026-10-10 实测）：
      //   digi-service 必须是 JSON `{"name":"<svc>"}`，传裸串会被服务端判为
      //   「无效的身份令牌，请联系管理员分配身份令牌！」（误导性报错）；
      //   digi-datakey 必须是 JSON `{"CompanyId":"<账套>"}`，传裸串报 `digi-datakey is not valid.`
      const headers = buildHeaders(config, serviceName);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers },
        body: JSON.stringify(envelope),
      });

      // 必须先判 HTTP 状态码：错误 token 返 500 + HTML 错误页，
      // 尝试 JSON.parse 会抛未捕获异常（易飞硬约束）。
      if (response.status !== 200) {
        const isHtml = response.headers.get('content-type')?.includes('html') ?? false;
        return {
          success: false,
          service: serviceName,
          error: {
            type: 'http_error',
            status: response.status,
            message:
              `HTTP ${response.status}。` +
              (isHtml
                ? '响应体为 HTML 错误页（易飞对无效 token 返回 500 + HTML），请重新获取身份令牌。'
                : '响应体非 JSON，未尝试解析。'),
          },
        };
      }

      const bodyText = await response.text();
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(bodyText);
      } catch {
        return {
          success: false,
          service: serviceName,
          error: { type: 'parse_error', message: '响应体不是合法 JSON' },
        };
      }

      return {
        success: true,
        service: serviceName,
        result: body,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        service: serviceName,
        error: { type: 'api_error', message },
      };
    }
  }

  // ---- Standard type_key + operation 模式 ----
  const typeKey = request.type_key;
  const operation = request.operation;

  if (!typeKey || !operation) {
    return {
      success: false,
      error: {
        type: 'validation_error',
        message: "Either 'service' or both 'type_key' and 'operation' must be provided.",
      },
    };
  }

  if (!(VALID_OPERATIONS as readonly string[]).includes(operation)) {
    return {
      success: false,
      type_key: typeKey,
      operation,
      error: {
        type: 'validation_error',
        message: `Invalid operation '${operation}'. Must be one of: ${VALID_OPERATIONS.join(', ')}`,
      },
    };
  }

  const input = request.input ?? {};

  try {
    let result: unknown;
    const op = operation as YfOperation;

    switch (op) {
      case 'query':
        // 易飞 query 必须带 conditions，缺省时自动补空对象
        const qInput = (input && typeof input === 'object' && !('conditions' in (input as Record<string, unknown>))) ? { ...(input as Record<string, unknown>), conditions: {} } : input;
        result = await context.client.query(typeKey, qInput as never);
        break;
      case 'read':
        result = await context.client.action(typeKey, 'read', input as never);
        break;
      case 'create':
        result = await context.client.create(typeKey, input as never);
        break;
      case 'update':
        result = await context.client.update(typeKey, input as never);
        break;
      case 'delete':
      case 'approve':
      case 'disapprove':
      case 'invalid':
        result = await context.client.action(typeKey, op, input as never);
        break;
      default:
        return {
          success: false,
          type_key: typeKey,
          operation,
          error: { type: 'validation_error', message: `Unknown operation: '${operation}'` },
        };
    }

    return {
      success: true,
      type_key: typeKey,
      operation,
      result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      type_key: typeKey,
      operation,
      error: describeRunError(err),
    };
  }
}

export const runTool: ToolDefinition = {
  name: 'yf_run',
  description:
    'Execute an ERP operation via yfcli. Two modes: ' +
    '(1) type_key+operation for standard TypeKey operations, ' +
    '(2) service for direct ERP OpenAPI custom endpoints (e.g. yf.ai.*). ' +
    'Use yf_validate first to check the request, or yf_help to discover field names.',
  inputSchema: {
    type: 'object',
    properties: {
      request: {
        type: 'object',
        description:
          'The request object. Mode 1 (standard): {type_key, operation, input}. ' +
          'Mode 2 (direct service): {service, input}.',
      },
    },
    required: ['request'],
  },
  handler: handleRun,
};