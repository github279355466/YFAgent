/**
 * 会话管理 —— AuthProvider 集成 + Token 注入 + 会话生命周期。
 *
 * MCP 是无状态协议，但 ERP 调用需要 token。
 * 每个 HTTP 请求从 Authorization Bearer header 提取 token，
 * 通过 AuthProvider 验证后注入到 ToolContext 中传递给工具 handler。
 *
 * P3 改造：
 * - 使用 auth 包的 TokenManager 替代简单的 token 存储
 * - 会话创建时验证凭据红线（CredentialGuard）
 * - 会话过期时清除 token
 */

import { YfClient, TypeKeyCatalog, FetchTransport } from 'yfcli-sdk';
import type { ResolvedRuntimeConfig } from 'yfcli-sdk';
import type { AuthProvider } from 'yfcli-auth';

/** 传给每个工具 handler 的上下文。 */
export interface ToolContext {
  /** 当前请求的 ERP token（从 Bearer header 提取，已验证）。 */
  readonly token: string;
  /** 已构造好的 YfClient（token 已注入）。 */
  readonly client: YfClient;
  /** TypeKey 目录（服务名查表）。 */
  readonly catalog: TypeKeyCatalog;
  /** AuthProvider 实例（可选，用于工具内部鉴权操作）。 */
  readonly auth?: AuthProvider;
}

/** 全局单例 catalog（只读数据，启动时加载一次）。 */
let cachedCatalog: TypeKeyCatalog | undefined;

/**
 * 加载 TypeKeyCatalog（懒加载 + 缓存）。
 *
 * catalog 是纯只读数据，所有会话共享同一实例。
 */
export async function loadCatalog(): Promise<TypeKeyCatalog> {
  if (cachedCatalog) return cachedCatalog;

  const { readFile } = await import('node:fs/promises');
  const { parse } = await import('yaml');
  const path = await import('node:path');

  // 从 workspace 根目录查找 knowledge/typekey/typekey_map.yaml
  const candidates = [
    path.resolve(process.cwd(), 'knowledge', 'typekey', 'typekey_map.yaml'),
    path.resolve(process.cwd(), '..', '..', 'knowledge', 'typekey', 'typekey_map.yaml'),
  ];

  let yamlText: string | undefined;
  for (const candidate of candidates) {
    try {
      yamlText = await readFile(candidate, 'utf-8');
      break;
    } catch {
      // try next
    }
  }

  if (!yamlText) {
    throw new Error(
      '找不到 knowledge/typekey/typekey_map.yaml。' +
      '请确认工作目录或运行 npm run gen:typekey 生成。',
    );
  }

  cachedCatalog = new TypeKeyCatalog(parse(yamlText));
  return cachedCatalog;
}

/**
 * 为单个请求创建 ToolContext。
 *
 * token 来自 HTTP Authorization header，已通过 AuthProvider 验证。
 * 手动构造 ResolvedRuntimeConfig，绕过 env 读取。
 */
export function createToolContext(
  token: string,
  catalog: TypeKeyCatalog,
  auth?: AuthProvider,
): ToolContext {
  const baseUrl = (process.env['YF_BASE_URL'] ?? '').replace(/\/+$/, '');
  // YF_BASE_URL 只存 IP 或 http://IP，路径由代码拼接（客户部署时只需改 IP）
  const YF_API_PATH = '/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost';
  const endpoint = baseUrl.includes('/YFOAP/') ? baseUrl : baseUrl + YF_API_PATH;

  const runtimeConfig: ResolvedRuntimeConfig = {
    baseUrl,
    endpoint,
    companyId: process.env['YF_COMPANY_ID'] ?? '',
    token,
    servicePrefix: 'yf.',
    timeoutMs: 30_000,
    warnOnSilentError: true,
  };

  const client = new YfClient({
    config: runtimeConfig,
    catalog,
    transport: new FetchTransport(),
  });

  return { token, client, catalog, auth };
}

/** 会话过期时间（毫秒）：30 分钟。 */
export const SESSION_TTL_MS = 30 * 60 * 1000;

/** 会话清理间隔（毫秒）：5 分钟。 */
export const SESSION_CLEANUP_INTERVAL_MS = 5 * 60_000;


