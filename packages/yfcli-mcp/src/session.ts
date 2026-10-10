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
import type { ResolvedRuntimeConfig, YfEnumFieldSpec } from 'yfcli-sdk';
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
  /** 枚举字段规格（字段名 → 合法编码集），用于校验/清洗回参形态的值。 */
  readonly enumSpecs?: Readonly<Record<string, YfEnumFieldSpec>>;
}

/** 全局单例 catalog（只读数据，启动时加载一次）。 */
let cachedCatalog: TypeKeyCatalog | undefined;

/** 全局单例枚举规格（只读数据，启动时加载一次）。 */
let cachedEnumSpecs: Record<string, YfEnumFieldSpec> | undefined;


/**
 * 加载枚举字段规格（懒加载 + 缓存）。
 *
 * 数据源：knowledge/enums/enums.yaml（由 scripts/gen_enums_from_oapmb.py 生成）。
 * 产物形状：type_key → field_alias → { cn_name, field_code, node_code, values }。
 *
 * 本函数把它扁平化为「字段名 → YfEnumFieldSpec」全集（跨 type_key 合并）：
 * 同一字段名在不同对象下枚举语义一致（如 approve_status 恒为审核码），
 * 因此按字段名去重是安全的，且能让清洗对**未列入字典的 type_key** 也生效。
 *
 * 用途：YfClient 的 enumSpecs —— 清洗 Agent 误把回参「Y.」当条件的静默错误。
 */
export async function loadEnumSpecs(): Promise<Record<string, YfEnumFieldSpec>> {
  if (cachedEnumSpecs) return cachedEnumSpecs;

  const { readFile } = await import('node:fs/promises');
  const { parse } = await import('yaml');
  const path = await import('node:path');

  const candidates = [
    path.resolve(process.cwd(), 'knowledge', 'enums', 'enums.yaml'),
    path.resolve(process.cwd(), '..', '..', 'knowledge', 'enums', 'enums.yaml'),
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

  // 字典缺失不应让服务启动失败：清洗是「锦上添花」，缺了只少一层告警。
  if (!yamlText) {
    cachedEnumSpecs = {};
    return cachedEnumSpecs;
  }

  const parsed = parse(yamlText) as Record<string, unknown> | null;
  const specs: Record<string, YfEnumFieldSpec> = {};

  if (parsed && typeof parsed === 'object') {
    for (const fields of Object.values(parsed)) {
      if (!fields || typeof fields !== 'object') continue;
      for (const [fieldName, meta] of Object.entries(fields as Record<string, unknown>)) {
        if (!meta || typeof meta !== 'object') continue;
        const values = (meta as Record<string, unknown>)['values'];
        if (!values || typeof values !== 'object') continue;
        // 凡登记在枚举字典中的字段，其回参都可能带「.描述」/「.」后缀，纳入清洗范围。
        // 同时带上合法编码集 —— 守卫据此区分「枚举 1.内含」与「数值 2.65」，
        // 后者点前不是合法编码，不会被误剥离。
        const codes = new Set(Object.keys(values as Record<string, unknown>));
        const existingCodes = specs[fieldName]?.codes;
        if (existingCodes !== undefined) {
          for (const c of existingCodes) codes.add(c);
        }
        specs[fieldName] = { fieldName, codedText: true, codes };
        continue;
      }
    }
  }

  cachedEnumSpecs = specs;
  return cachedEnumSpecs;
}

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
  enumSpecs?: Record<string, YfEnumFieldSpec>,
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
    // 枚举清洗：把 Agent 误传的回参形态（"Y." / "Y.已审核"）纠正为纯编码。
    // 缺省空对象 —— 清洗是附加能力，缺失不应阻断调用。
    ...(enumSpecs !== undefined ? { enumSpecs } : {}),
  });

  return { token, client, catalog, auth, ...(enumSpecs !== undefined ? { enumSpecs } : {}) };
}

/** 会话过期时间（毫秒）：30 分钟。 */
export const SESSION_TTL_MS = 30 * 60 * 1000;

/** 会话清理间隔（毫秒）：5 分钟。 */
export const SESSION_CLEANUP_INTERVAL_MS = 5 * 60_000;