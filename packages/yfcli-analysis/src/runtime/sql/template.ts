/**
 * SQL 模板注册表（易飞版 · B 方案地基 · 客户本地 Runtime + 只读 SQL）
 *
 * 从 YZCLI 移植，适配易飞产品线：
 *   - 审核码默认 'Y'（易飞 Y/N/V，V=作废；YZCLI 用 'T'/'F'）
 *   - ★ 新增硬门禁：注册时扫描 SQL 文本，FROM/JOIN 子句中只允许 vw_ai_* 视图
 *     出现物理表名即抛错（防 LLM 或开发者误写直查物理表）
 *   - 占位符统一 `:name`；执行器负责转换为 mssql 的 @name
 *
 * 安全模型：
 *   - 调用方（含 LLM）只能给 template_id + 参数值，永远碰不到 SQL 文本
 *   - 参数值不内联进 SQL：renderSql 返回 { sql, values }，由驱动做参数绑定
 *   - 注册时静态校验：只读（禁 DML/DDL）、禁多语句、必须带行数上限、只查 vw_ai_*
 */
import { AnalysisError, ErrorCode } from "../calc/errors.js";

export type SqlParamType = "string" | "date" | "number";

export interface SqlParamDef {
  name: string;
  type: SqlParamType;
  required: boolean;
  description?: string;
  /**
   * 缺省值（可选参数未传时使用）。
   * 如审核码缺省 'Y'（只统计已审核单据），避免忘传把未审核数据算进统计。
   */
  default?: unknown;
}

export interface SqlTemplate {
  id: string;
  label: string;
  description?: string;
  params: SqlParamDef[];
  /** 预置 SQL，只允许 SELECT/WITH，占位符 `:name`，只查 vw_ai_* 视图 */
  sql: string;
  /** 该模板允许的最大返回行数（执行器强制，调用方无法突破） */
  max_rows: number;
  /** 查询超时（毫秒） */
  timeout_ms: number;
}

/** 只读起始关键字 */
const READONLY_STARTS = ["select", "with"];

/** 危险关键字（整词匹配） */
const FORBIDDEN = [
  "insert", "update", "delete", "drop", "truncate", "alter", "create",
  "exec", "execute", "merge", "grant", "revoke", "sp_", "xp_",
];

/**
 * ★ vw_ai_* 白名单门禁：
 * 提取 FROM / JOIN 后的标识符，检查是否全部以 vw_ai_ 开头。
 * 允许的上下文：FROM vw_ai_xxx / JOIN vw_ai_xxx / WITH ... AS (SELECT ... FROM vw_ai_xxx)
 */
function extractTableRefs(sql: string): string[] {
  // 匹配 FROM/JOIN 后面的标识符（支持 schema.table 格式）
  const re = /\b(?:FROM|JOIN)\s+(?:dbo\.)?([A-Za-z_][A-Za-z0-9_]*)/gi;
  const refs: string[] = [];
  for (const m of sql.matchAll(re)) {
    refs.push(m[1]!);
  }
  return refs;
}

export function defineTemplate(t: SqlTemplate): SqlTemplate {
  return t;
}

/** 静态校验：只读 / 无多语句 / 有行数上限 / ★ 只查 vw_ai_* */
export function validateTemplate(t: SqlTemplate): void {
  const sql = t.sql.trim();
  const head = sql.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!READONLY_STARTS.includes(head)) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 模板 ${t.id} 必须以 SELECT 或 WITH 开头（只读），实为「${head}」`,
    );
  }
  for (const kw of FORBIDDEN) {
    const re = new RegExp(`\\b${kw.replace("_", "[_]?")}`, "i");
    if (re.test(sql)) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `SQL 模板 ${t.id} 含非只读关键字「${kw}」`,
      );
    }
  }
  if (sql.includes(";")) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 模板 ${t.id} 含分号（禁止多语句，防拼接注入）`,
    );
  }
  if (!/\bTOP\s*\(?\s*:max_rows/i.test(sql) && !/\bLIMIT\s+:max_rows/i.test(sql)) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 模板 ${t.id} 必须使用 :max_rows 作为行数上限（TOP(:max_rows) 或 LIMIT :max_rows）`,
    );
  }
  if (!(t.max_rows > 0)) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 模板 ${t.id} 的 max_rows 必须为正整数`,
    );
  }

  // ★ vw_ai_* 白名单门禁
  const tableRefs = extractTableRefs(sql);
  for (const ref of tableRefs) {
    if (!ref.toLowerCase().startsWith("vw_ai_")) {
      throw new AnalysisError(
        ErrorCode.POLICY_VIOLATION,
        `SQL 模板 ${t.id} 引用了非 vw_ai_* 视图/表「${ref}」——只允许查询 vw_ai_* 视图`,
      );
    }
  }
}

export class SqlTemplateRegistry {
  private templates = new Map<string, SqlTemplate>();

  register(t: SqlTemplate): void {
    validateTemplate(t);
    this.templates.set(t.id, t);
  }

  get(id: string): SqlTemplate | undefined {
    return this.templates.get(id);
  }

  list(): SqlTemplate[] {
    return [...this.templates.values()];
  }

  get size(): number {
    return this.templates.size;
  }
}

export interface RenderedSql {
  sql: string;
  values: Record<string, unknown>;
  max_rows: number;
  timeout_ms: number;
}

/**
 * 渲染模板：校验参数 → 产出 { sql, values }。
 * 调用方请求的行数上限超过模板上限时，以模板上限为准。
 */
export function renderSql(
  t: SqlTemplate,
  params: Record<string, unknown>,
  requestedMaxRows?: number,
): RenderedSql {
  for (const p of t.params) {
    if (p.required && (params[p.name] === undefined || params[p.name] === null || params[p.name] === "")) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `SQL 模板 ${t.id} 缺少必填参数「${p.name}」（避免半截条件导致全表扫描）`,
      );
    }
  }
  const declared = new Set(t.params.map((p) => p.name));
  for (const k of Object.keys(params)) {
    if (!declared.has(k)) {
      throw new AnalysisError(
        ErrorCode.VALIDATION_ERROR,
        `SQL 模板 ${t.id} 收到未声明参数「${k}」`,
      );
    }
  }
  const filled: Record<string, unknown> = { ...params };
  for (const p of t.params) {
    if (!p.required && filled[p.name] === undefined && p.default !== undefined) {
      filled[p.name] = p.default;
    }
  }
  const maxRows = Math.min(requestedMaxRows ?? t.max_rows, t.max_rows);
  return {
    sql: t.sql,
    values: { ...filled, max_rows: maxRows },
    max_rows: maxRows,
    timeout_ms: t.timeout_ms,
  };
}
