/**
 * 配置校验 —— fail-fast，缺项立即抛 YfConfigError，不做静默降级。
 *
 * 为什么必须 fail-fast（易助侧反面教材）：
 * 易助 `client.ts:79-81` 把产品线前缀硬编码，换产品线时全部调用失败，
 * 且报错发生在远端而非本地，排障成本极高。
 * 本仓 COLLABORATION.md 示例即以「servicePrefix 配置化，缺省启动即失败」为改造样板。
 */

import type {
  ResolvedRuntimeConfig,
  YfConfigValidation,
  YfConfigViolation,
  YfSdkConfig,
} from '../types/config.js';
import { YfConfigError } from '../types/config.js';

/** 易飞 OpenAPI 唯一入口路径（大小写敏感，官方显式标注）。 */
export const YF_ENDPOINT_PATH = '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';

/** 固定内容类型。真机验证必填。 */
export const YF_CONTENT_TYPE = 'application/json; charset=utf-8';

/** 超时上限护栏：超过 10 分钟视为配置错误，而非耐心等待。 */
const TIMEOUT_CEILING_MS = 600_000;

/**
 * 校验配置。
 *
 * 返回全部违规项而非首个 —— 便于使用者一次改齐。
 * 调用方应使用 {@link assertValidConfig} 以获得 fail-fast 行为。
 */
export function validateConfig(config: YfSdkConfig): YfConfigValidation {
  const violations: YfConfigViolation[] = [];

  if (!isNonBlank(config.baseUrl)) {
    violations.push({
      field: 'baseUrl',
      reason: '必填。易飞只有一个固定入口 URL，且不带端口号（如 http://{IP}）',
    });
  } else if (!isHttpUrl(config.baseUrl)) {
    violations.push({
      field: 'baseUrl',
      reason: '必须是 http/https 绝对URL。易飞侧无 https 要求，但不得写成裸 IP 加路径',
    });
  } else if (hasTrailingPath(config.baseUrl)) {
    violations.push({
      field: 'baseUrl',
      reason:
        '只填到主机部分即可，勿含路径。入口路径由 SDK 拼接（常量 YF_ENDPOINT_PATH），' +
        '路径大小写敏感，写死会导致 404',
    });
  }

  if (!isNonBlank(config.companyId)) {
    violations.push({
      field: 'companyId',
      reason:
        '必填。经 digi-datakey 头传递；缺失时易飞返回 digi-datakey is not valid.',
    });
  }

  if (!isNonBlank(config.tokenEnvVar)) {
    violations.push({
      field: 'tokenEnvVar',
      reason: '必填。只允许写环境变量名，配置文件中不得落令牌明文',
    });
  } else if (!isEnvVarName(config.tokenEnvVar)) {
    violations.push({
      field: 'tokenEnvVar',
      reason: `非法环境变量名：${config.tokenEnvVar}。只允许字母、数字、下划线，且不得以数字开头`,
    });
  }

  if (!isNonBlank(config.servicePrefix)) {
    violations.push({
      field: 'servicePrefix',
      reason:
        '必填。易飞为 yf.，易助为 yz.，不可互相沿用。' +
        '缺失时启动失败，避免换产品线后全部服务名失效',
    });
  } else if (config.servicePrefix !== 'yf.' && config.servicePrefix !== 'yf') {
    violations.push({
      field: 'servicePrefix',
      reason:
        `当前 SDK 仅支持易飞产品线，期望 yf. 或 yf，收到 ${config.servicePrefix}。` +
        '若确需接入易助，应另建 yzcli-sdk 而非放宽本校验',
    });
  }

  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0) {
    violations.push({
      field: 'timeoutMs',
      reason: `必须是正有限毫秒数，收到 ${String(config.timeoutMs)}`,
    });
  } else if (config.timeoutMs > TIMEOUT_CEILING_MS) {
    violations.push({
      field: 'timeoutMs',
      reason: `不得超过 ${TIMEOUT_CEILING_MS} 毫秒，收到 ${config.timeoutMs}。` +
        '易飞侧接口级超时时间文档未说明，长挂起会耗尽连接池',
    });
  }

  return { ok: violations.length === 0, errors: violations };
}

/** fail-fast 校验：有任一违规项立即抛出。 */
export function assertValidConfig(config: YfSdkConfig): void {
  const result = validateConfig(config);
  if (!result.ok) {
    throw new YfConfigError(result.errors);
  }
}

/** 环境变量容器。用本地最小结构声明，避免 SDK 强依赖 @types/node。 */
export type EnvLike = Readonly<Record<string, string | undefined>>;

/**
 * 校验并从环境变量解析令牌，得到可直接发请求的运行时配置。
 *
 * 分两步的原因：结构合法性可离线校验（CI 可跑），
 * 令牌是否已在环境中只有运行时才知道。
 */
export function resolveRuntimeConfig(
  config: YfSdkConfig,
  env: EnvLike,
): ResolvedRuntimeConfig {
  assertValidConfig(config);

  const token = env[config.tokenEnvVar];
  if (token === undefined || !isNonBlank(token)) {
    throw new YfConfigError([
      {
        field: config.tokenEnvVar,
        reason:
          `环境变量未设置或为空。令牌值只允许从环境变量注入；` +
          `缺失时易飞返回 HTTP 500 + HTML 错误页（不是 JSON）`,
      },
    ]);
  }

  return {
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
    endpoint: config.baseUrl.replace(/\/+$/, '') + YF_ENDPOINT_PATH,
    companyId: config.companyId,
    token,
    servicePrefix: config.servicePrefix,
    timeoutMs: config.timeoutMs,
    warnOnSilentError: config.warnOnSilentError,
  };
}

// ------------------------------------------------------------------ 局部谓词

function isNonBlank(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 检测 baseUrl 是否误含路径段（形如 `/YFOAP/...`）。 */
function hasTrailingPath(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.pathname !== '/' && parsed.pathname !== '';
  } catch {
    return false;
  }
}

function isEnvVarName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}