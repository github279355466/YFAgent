/**
 * SQL 数据源配置（易飞版 · 多客户环境适配）
 *
 * 从 YZCLI 移植，保持相同的红线规则：
 *   1. 密码只允许从环境变量取——配置里写的是环境变量名（password_env），
 *      出现 password 明文一律拒绝
 *   2. limits 必填（行数/超时兜底），allowed_templates 白名单不得为空
 *   3. 配置文件不进代码库（仓库只提供 analysis-sql.example.json 模板）
 *
 * 格式用 JSON：保持 yfcli-analysis 包零第三方依赖（mssql 只在 driver.ts 引入）。
 */
import { readFileSync } from "node:fs";
import { AnalysisError, ErrorCode } from "../calc/errors.js";

export interface SqlDataSourceConfig {
  id: string;
  label?: string;
  server: string;
  port?: number;
  database: string;
  /** 用户名来源的环境变量名 */
  user_env: string;
  /** 密码来源的环境变量名（禁止直接写 password） */
  password_env: string;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    readOnlyIntent?: boolean;
    connectTimeout?: number;
  };
  limits: {
    max_rows: number;
    timeout_ms: number;
  };
  allowed_templates: string[];
}

/** L4 审计日志配置 */
export interface SqlAuditConfig {
  /** 是否启用审计日志 */
  enabled: boolean;
  /** sink 类型：console（默认）/ file / none */
  sink?: "console" | "file" | "none";
  /** sink='file' 时的文件路径 */
  filePath?: string;
}

export interface SqlConfig {
  version: string;
  datasources: SqlDataSourceConfig[];
  /** L4 审计日志配置（可选） */
  audit?: SqlAuditConfig;
}

export interface ResolvedCredentials {
  user: string;
  password: string;
}

const FORBIDDEN_KEYS = ["password", "pwd", "user", "uid", "sa_password"];

export function loadSqlConfig(path: string): SqlConfig {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 配置文件读取失败：${path}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 配置文件不是合法 JSON：${path}`,
    );
  }
  const cfg = parsed as SqlConfig;
  validateSqlConfig(cfg);
  return cfg;
}

export function validateSqlConfig(cfg: SqlConfig): void {
  if (!cfg.datasources || cfg.datasources.length === 0) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 配置缺少 datasources`,
    );
  }
  for (const ds of cfg.datasources) {
    // 1. 明文凭据红线
    const bag = ds as unknown as Record<string, unknown>;
    for (const k of FORBIDDEN_KEYS) {
      if (bag[k] !== undefined) {
        throw new AnalysisError(
          ErrorCode.VALIDATION_ERROR,
          `数据源 ${ds.id} 配置含明文凭据字段「${k}」——请改用 user_env / password_env（环境变量）`,
        );
      }
    }
    if (!ds.user_env || !ds.password_env) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `数据源 ${ds.id} 缺少 user_env / password_env`,
      );
    }
    // 2. limits 必填
    if (!ds.limits || !(ds.limits.max_rows > 0) || !(ds.limits.timeout_ms > 0)) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `数据源 ${ds.id} 缺少或非法的 limits（max_rows / timeout_ms 必须为正整数）`,
      );
    }
    // 3. 模板白名单不得为空
    if (!Array.isArray(ds.allowed_templates) || ds.allowed_templates.length === 0) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `数据源 ${ds.id} 的 allowed_templates 为空——必须显式声明允许执行的模板`,
      );
    }
  }
  // 4. 审计配置校验
  if (cfg.audit?.sink === "file" && !cfg.audit.filePath) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `审计配置 sink='file' 时必填 filePath`,
    );
  }
}

/** 从环境变量解析凭据；缺任一即报错 */
export function resolveCredentials(ds: SqlDataSourceConfig): ResolvedCredentials {
  const user = process.env[ds.user_env];
  const password = process.env[ds.password_env];
  const missing = [!user ? ds.user_env : null, !password ? ds.password_env : null].filter(Boolean);
  if (missing.length) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `数据源 ${ds.id} 缺少环境变量：${missing.join("、")}（凭据只允许经环境变量注入）`,
    );
  }
  return { user: user!, password: password! };
}

export function getDataSourceConfig(cfg: SqlConfig, id: string): SqlDataSourceConfig {
  const ds = cfg.datasources.find((d) => d.id === id);
  if (!ds) {
    throw new AnalysisError(ErrorCode.VALIDATION_ERROR, `未配置的 SQL 数据源：${id}`);
  }
  return ds;
}
