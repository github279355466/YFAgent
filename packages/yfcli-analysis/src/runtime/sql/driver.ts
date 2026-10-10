/**
 * 生产 MSSQL Driver（★ YZCLI 缺失，易飞版新增）
 *
 * 使用 mssql npm 包实现 SqlDriver 接口：
 *   - 连接池复用（mssql.ConnectionPool）
 *   - 参数化查询（防注入）
 *   - 超时控制（request.timeout）
 *   - ★ 凭据只经 resolveCredentials（环境变量）注入，构造参数不接受明文
 *
 * 占位符转换：模板用 :name，mssql 用 @name。
 * 本驱动在 query() 内自动完成转换。
 */
import type { SqlDriver } from "./executor.js";
import { AnalysisError, ErrorCode } from "../calc/errors.js";
import type { SqlDataSourceConfig, ResolvedCredentials } from "./config.js";
import { resolveCredentials } from "./config.js";

/** mssql 包的类型（延迟 import 避免无 mssql 时启动报错） */
interface MssqlPool {
  connect(): Promise<MssqlPool>;
  request(): MssqlRequest;
  close(): Promise<void>;
}

interface MssqlRequest {
  input(name: string, value: unknown): void;
  timeout(ms: number): void;
  query(sql: string): Promise<{ recordset: Record<string, unknown>[] }>;
}

/**
 * Driver 构造参数。
 *
 * ★ 凭据红线（P0-5 / P0-C）：本接口**刻意不提供** `connectionString` / `password`
 *   等明文入口。凭据的唯一来源是 `SqlDataSourceConfig` + `resolveCredentials()`
 *   （从 `user_env` / `password_env` 指向的环境变量读取）。
 *   任何"接受裸连接串"的出口都会绕过 `validateSqlConfig` 的明文凭据拦截，
 *   因此在此类型层面直接不提供该能力。
 */
export interface MssqlDriverOptions {
  /** 数据源配置（凭据经 user_env / password_env 注入，不含明文） */
  dataSource: SqlDataSourceConfig;
  /** 可注入的凭据解析器（默认 resolveCredentials，便于测试替换） */
  resolveCredentialsFn?: (ds: SqlDataSourceConfig) => ResolvedCredentials;
}

/**
 * 将模板占位符 :name 转换为 mssql 的 @name。
 *
 * 不区分上下文地做 `/:name/g` 替换会篡改字符串字面量与注释中的同形文本
 * （历史缺陷 P0-4）。此处按 T-SQL 词法逐段扫描：
 *   - 单引号字符串字面量（含 '' 转义）整段原样保留
 *   - `--` 行注释、块注释（斜杠-星号 … 星号-斜杠） 块注释整段原样保留
 *   - 其余部分的 `:identifier` 才替换为 `@identifier`
 */
export function convertPlaceholders(sql: string): string {
  let out = "";
  const n = sql.length;
  let i = 0;

  while (i < n) {
    const ch = sql[i]!;

    // 行注释
    if (ch === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      const end = nl === -1 ? n : nl;
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    // 块注释
    if (ch === "/" && sql[i + 1] === "*") {
      const close = sql.indexOf("*/", i + 2);
      const end = close === -1 ? n : close + 2;
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    // 字符串字面量（含 '' 转义）
    if (ch === "'") {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue; }
          j++;
          break;
        }
        j++;
      }
      out += sql.slice(i, j);
      i = j;
      continue;
    }

    // 占位符 :name
    if (ch === ":") {
      const m = /^:([A-Za-z_][A-Za-z0-9_]*)/.exec(sql.slice(i));
      if (m) {
        out += "@" + m[1];
        i += m[0].length;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

export class MssqlDriver implements SqlDriver {
  private pool: MssqlPool | null = null;
  private readonly opts: MssqlDriverOptions;
  private poolPromise: Promise<MssqlPool> | null = null;

  constructor(opts: MssqlDriverOptions) {
    // 运行时兜底：类型层面已移除明文入口，但 JS 调用方/未类型化数据仍可能传入。
    // fail-fast 而非静默忽略 —— 否则「传了明文却没用上」会被误认为凭据已配置。
    const raw = opts as unknown as Record<string, unknown>;
    for (const k of ["connectionString", "password", "pwd", "user", "uid"]) {
      if (raw[k] !== undefined) {
        throw new AnalysisError(
          ErrorCode.VALIDATION_ERROR,
          `MssqlDriver 不接受明文凭据字段「${k}」——请通过 dataSource(user_env/password_env) 注入`,
        );
      }
    }
    if (!opts.dataSource) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `MssqlDriver 缺少 dataSource——凭据只允许经 resolveCredentials 从环境变量注入`,
      );
    }
    this.opts = opts;
  }

  /** 延迟初始化连接池（首次 query 时建立） */
  private async getPool(): Promise<MssqlPool> {
    if (this.pool) return this.pool;
    if (this.poolPromise) return this.poolPromise;

    this.poolPromise = (async () => {
      let mssql: typeof import("mssql");
      try {
        mssql = await import("mssql");
      } catch {
        throw new AnalysisError(
          ErrorCode.EXECUTION_ERROR,
          `mssql 包未安装——请运行 npm install mssql`,
        );
      }

      // ★ 凭据经唯一合规路径解析（环境变量）。缺失即抛错，
      //   不会静默发出空凭据请求（对应 P0-8 的同类防护）。
      const ds = this.opts.dataSource;
      const resolver = this.opts.resolveCredentialsFn ?? resolveCredentials;
      const creds = resolver(ds);

      const config: Record<string, unknown> = {
        server: ds.server,
        port: ds.port,
        database: ds.database,
        user: creds.user,
        password: creds.password,
        options: ds.options ?? {},
      };

      const pool = new mssql.ConnectionPool(config as never);
      await pool.connect();
      this.pool = pool as unknown as MssqlPool;
      return this.pool;
    })();

    return this.poolPromise;
  }

  async query(
    sql: string,
    values: Record<string, unknown>,
    opts: { timeoutMs: number; maxRows: number },
  ): Promise<Record<string, unknown>[]> {
    const pool = await this.getPool();
    const request = pool.request();
    request.timeout(opts.timeoutMs);

    // 绑定参数
    for (const [key, val] of Object.entries(values)) {
      request.input(key, val);
    }

    // 转换占位符 :name → @name
    const mssqlSql = convertPlaceholders(sql);

    const result = await request.query(mssqlSql);
    return result.recordset;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.poolPromise = null;
    }
  }
}