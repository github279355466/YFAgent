/**
 * L2 SQL 执行器（易飞版 · B 方案四层防护之 L2）
 *
 * 从 YZCLI 移植，适配易飞产品线：
 *   - 审核码一致性校验改为易飞审核码字段（approve_status = 'Y'）
 *   - ★ L3 白名单校验：启动时校验 allowed_templates 数量 === 注册模板数量
 *   - ★ L4 审计日志：每次执行前后记录完整上下文（脱敏参数 + 耗时 + 状态）
 *   - 行数双保险 + 超时熔断保持不变
 *
 * 安全模型（与 template.ts 的注册制校验配套）：
 *   - 调用方只能给 template_id + 参数值，永远碰不到 SQL 文本
 *   - 参数不内联：renderSql 产物 {sql, values} 原样交给 driver 做参数绑定
 *   - 路由校验：仅允许 config.allowed_templates 白名单内的模板
 *   - 行数双保险：SQL 内 TOP(:max_rows) + 执行器对结果再截断
 *   - 超时熔断：timeout_ms 透传 driver
 */
import { AnalysisError, ErrorCode } from "../calc/errors.js";
import { renderSql, type SqlTemplate } from "./template.js";
import { type SqlConfig, type SqlDataSourceConfig } from "./config.js";
import {
  type AuditEntry,
  type AuditSink,
  consoleAuditSink,
  sanitizeParams,
  truncateError,
} from "./audit.js";

/** 驱动接口：由调用方注入（mssql / 只读副本适配器…） */
export interface SqlDriver {
  query(
    sql: string,
    values: Record<string, unknown>,
    opts: { timeoutMs: number; maxRows: number },
  ): Promise<Record<string, unknown>[]>;
  close?(): Promise<void>;
}

export interface SqlExecutorOptions {
  config: SqlConfig;
  templates: SqlTemplate[];
  driver: SqlDriver;
  /** 是否做启动时白名单数量一致性校验，默认 true */
  validateWhitelist?: boolean;
  /** L4 审计 sink；未指定时使用 consoleAuditSink */
  auditSink?: AuditSink;
  /** 用户标识（写入审计条目） */
  userId?: string;
}

export class SqlExecutor {
  private readonly templates: Map<string, SqlTemplate>;
  private readonly config: SqlConfig;
  private readonly driver: SqlDriver;
  private auditSink: AuditSink | null;
  private readonly userId?: string;

  constructor(opts: SqlExecutorOptions) {
    this.config = opts.config;
    this.driver = opts.driver;
    this.templates = new Map(opts.templates.map((t) => [t.id, t]));
    this.userId = opts.userId;

    // 根据配置决定审计 sink
    if (opts.auditSink !== undefined) {
      this.auditSink = opts.auditSink;
    } else if (opts.config.audit?.enabled === false) {
      this.auditSink = null;
    } else {
      this.auditSink = consoleAuditSink;
    }

    // ★ L3 白名单门禁：启动时校验
    if (opts.validateWhitelist !== false) {
      this.validateWhitelistConsistency(opts.templates);
    }
  }

  /** 动态替换审计 sink（null = 禁用审计） */
  setAuditSink(sink: AuditSink | null): void {
    this.auditSink = sink;
  }

  /**
   * 执行一次模板查询。
   */
  async execute<T = Record<string, unknown>>(
    templateId: string,
    params: Record<string, unknown>,
    opts?: { maxRows?: number; dataSourceId?: string },
  ): Promise<T[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `SQL 模板未注册：${templateId}`,
      );
    }

    const ds = this.resolveDataSource(templateId, opts?.dataSourceId);

    const maxRows = Math.min(
      opts?.maxRows ?? template.max_rows,
      template.max_rows,
      ds.limits.max_rows,
    );

    const rendered = renderSql(template, params, maxRows);
    const startTime = Date.now();

    try {
      const rows = await this.driver.query(rendered.sql, rendered.values, {
        timeoutMs: Math.min(rendered.timeout_ms, ds.limits.timeout_ms),
        maxRows: rendered.max_rows,
      });
      const capped = rows.length > rendered.max_rows ? rows.slice(0, rendered.max_rows) : rows;

      // ★ L4 审计：成功
      this.emitAudit({
        templateId,
        dataSourceId: opts?.dataSourceId,
        params,
        rowCount: capped.length,
        durationMs: Date.now() - startTime,
        status: "success",
      });

      return capped as T[];
    } catch (e) {
      // ★ L4 审计：失败
      this.emitAudit({
        templateId,
        dataSourceId: opts?.dataSourceId,
        params,
        rowCount: 0,
        durationMs: Date.now() - startTime,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });

      throw new AnalysisError(
        ErrorCode.EXECUTION_ERROR,
        `SQL 模板 ${templateId} 执行失败：${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * ★ L4 审计发射：sink 异常不影响业务流程。
   */
  private emitAudit(partial: {
    templateId: string;
    dataSourceId?: string;
    params: Record<string, unknown>;
    rowCount: number;
    durationMs: number;
    status: "success" | "error";
    error?: string;
  }): void {
    if (!this.auditSink) return;

    try {
      const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        templateId: partial.templateId,
        dataSourceId: partial.dataSourceId,
        params: sanitizeParams(partial.params),
        rowCount: partial.rowCount,
        durationMs: partial.durationMs,
        status: partial.status,
        error: partial.error !== undefined ? truncateError(partial.error) : undefined,
        userId: this.userId,
      };
      this.auditSink(entry);
    } catch (sinkErr) {
      // 审计 sink 异常不能中断业务
      console.warn(
        `[yfcli-analysis] 审计 sink 异常：${sinkErr instanceof Error ? sinkErr.message : String(sinkErr)}`,
      );
    }
  }

  /** 找允许该模板的数据源（白名单） */
  private resolveDataSource(templateId: string, dataSourceId?: string): SqlDataSourceConfig {
    const candidates = this.config.datasources.filter((d) =>
      d.allowed_templates.includes(templateId),
    );
    if (dataSourceId) {
      const ds = candidates.find((d) => d.id === dataSourceId);
      if (!ds) {
        throw new AnalysisError(
          ErrorCode.VALIDATION_ERROR,
          `数据源 ${dataSourceId} 未允许模板 ${templateId}（allowed_templates 白名单）`,
        );
      }
      return ds;
    }
    if (candidates.length === 0) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `模板 ${templateId} 不在任何数据源的 allowed_templates 白名单内`,
      );
    }
    return candidates[0]!;
  }

  /**
   * ★ L3 白名单门禁：
   * 校验每个数据源的 allowed_templates 数量 === 注册模板数量。
   * 不一致即抛错（防配置遗漏或多余模板未被白名单覆盖）。
   */
  private validateWhitelistConsistency(templates: SqlTemplate[]): void {
    const registeredIds = new Set(templates.map((t) => t.id));
    for (const ds of this.config.datasources) {
      const allowedSet = new Set(ds.allowed_templates);
      // 检查白名单中是否有未注册的模板
      for (const id of allowedSet) {
        if (!registeredIds.has(id)) {
          throw new AnalysisError(
            ErrorCode.VALIDATION_ERROR,
            `数据源 ${ds.id} 的 allowed_templates 包含未注册模板「${id}」`,
          );
        }
      }
      // 检查是否有注册模板不在白名单中
      for (const id of registeredIds) {
        if (!allowedSet.has(id)) {
          throw new AnalysisError(
            ErrorCode.VALIDATION_ERROR,
            `数据源 ${ds.id} 的 allowed_templates 缺少已注册模板「${id}」（白名单数量 ${allowedSet.size} ≠ 注册模板数量 ${registeredIds.size}）`,
          );
        }
      }
    }
  }
}
