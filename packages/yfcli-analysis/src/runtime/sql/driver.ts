/**
 * 生产 MSSQL Driver（★ YZCLI 缺失，易飞版新增）
 *
 * 使用 mssql npm 包实现 SqlDriver 接口：
 *   - 连接池复用（mssql.ConnectionPool）
 *   - 参数化查询（防注入）
 *   - 超时控制（request.timeout）
 *   - 连接字符串从环境变量取（YFCLI_DB_CONNECTION_STRING）
 *
 * 占位符转换：模板用 :name，mssql 用 @name。
 * 本驱动在 query() 内自动完成转换。
 */
import type { SqlDriver } from "./executor.js";
import { AnalysisError, ErrorCode } from "../calc/errors.js";

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

export interface MssqlDriverOptions {
  /** 连接字符串（如 Server=.;Database=YFDB;User Id=xxx;Password=xxx;TrustServerCertificate=true） */
  connectionString?: string;
  /** 或通过独立参数构建 */
  server?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    connectTimeout?: number;
  };
}

/**
 * 将模板占位符 :name 转换为 mssql 的 @name。
 * 注意：不替换 :max_rows 以外的字符串内容（如 'http://...' 中的冒号）。
 * 策略：只替换 `:identifier` 模式（后跟非标识符字符或行尾）。
 */
export function convertPlaceholders(sql: string): string {
  return sql.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, "@$1");
}

export class MssqlDriver implements SqlDriver {
  private pool: MssqlPool | null = null;
  private readonly opts: MssqlDriverOptions;
  private poolPromise: Promise<MssqlPool> | null = null;

  constructor(opts: MssqlDriverOptions) {
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

      const config: Record<string, unknown> = {};
      if (this.opts.connectionString) {
        // mssql 支持 connectionString 直接传入
        Object.assign(config, { connectionString: this.opts.connectionString });
      } else {
        Object.assign(config, {
          server: this.opts.server,
          port: this.opts.port,
          database: this.opts.database,
          user: this.opts.user,
          password: this.opts.password,
          options: this.opts.options ?? {},
        });
      }

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

/**
 * 从环境变量创建 MssqlDriver。
 * 连接字符串环境变量：YFCLI_DB_CONNECTION_STRING
 */
export function createMssqlDriverFromEnv(): MssqlDriver {
  const connStr = process.env["YFCLI_DB_CONNECTION_STRING"];
  if (!connStr) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `缺少环境变量 YFCLI_DB_CONNECTION_STRING（数据库连接字符串）`,
    );
  }
  return new MssqlDriver({ connectionString: connStr });
}
