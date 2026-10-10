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

/** 词法单元：标识符 / 字符串字面量 / 标点 */
type SqlToken =
  | { kind: "ident"; value: string }
  | { kind: "punct"; value: string }
  | { kind: "other"; value: string };

/**
 * 词法扫描：把 SQL 拆成 token 流。
 *
 * 为什么不用正则截取表名（历史缺陷 P0-1 / P0-B）：
 *   正则只能覆盖「想得到」的写法；T-SQL 的标识符引用与连接语法是开放的
 *   （`[t]`、`"t"`、`dbo.t`、`t1, t2`、子查询……），漏掉任意一种即等于门禁失效。
 *   词法扫描把「识别」与「判定」分开：先得到结构化 token，再在 token 流上判定，
 *   且判定默认动作是**拒绝**（fail-closed）。
 *
 * 处理内容：
 *   - 单引号字符串字面量整段跳过（含 '' 转义），不参与表名判定
 *   - `--` 行注释与 块注释（斜杠-星号 … 星号-斜杠） 块注释整段跳过
 *   - `[]` 与 `""` 标识符引号剥离，内容作为 ident 返回
 *   - `schema.table` 按段落返回多个 ident，调用方取最后一段
 */
function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const n = sql.length;
  let i = 0;

  while (i < n) {
    const ch = sql[i]!;

    if (/\s/.test(ch)) { i++; continue; }

    // 行注释 -- ...
    if (ch === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? n : nl + 1;
      continue;
    }

    // 块注释 /* ... */
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }

    // 字符串字面量 '...'（'' 表示一个单引号）
    if (ch === "'") {
      i++;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") { i += 2; continue; }
          i++;
          break;
        }
        i++;
      }
      tokens.push({ kind: "other", value: "" });
      continue;
    }

    // 方括号标识符 [ ... ]（]] 表示一个 ]）
    if (ch === "[") {
      let value = "";
      i++;
      while (i < n) {
        if (sql[i] === "]") {
          if (sql[i + 1] === "]") { value += "]"; i += 2; continue; }
          i++;
          break;
        }
        value += sql[i];
        i++;
      }
      tokens.push({ kind: "ident", value });
      continue;
    }

    // 双引号标识符 " ... "（"" 表示一个 "）
    if (ch === '"') {
      let value = "";
      i++;
      while (i < n) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') { value += '"'; i += 2; continue; }
          i++;
          break;
        }
        value += sql[i];
        i++;
      }
      tokens.push({ kind: "ident", value });
      continue;
    }

    // 裸标识符
    if (/[A-Za-z_@#]/.test(ch)) {
      let value = "";
      while (i < n && /[A-Za-z0-9_@#$]/.test(sql[i]!)) {
        value += sql[i];
        i++;
      }
      tokens.push({ kind: "ident", value });
      continue;
    }

    // 标点
    tokens.push({ kind: "punct", value: ch });
    i++;
  }

  return tokens;
}

/** 表引用引出词 */
const TABLE_INTRODUCERS = new Set(["from", "join", "into", "apply"]);

/** 终止逗号连接判定的子句关键字 */
const CLAUSE_ENDERS = /^(where|group|having|order|union|on|select|by)$/i;

/**
 * ★ vw_ai_* 白名单门禁（fail-closed）：
 *
 * 在 token 流上找出所有「表引用引出位置」，取其后标识符链的**最后一段**
 * （`dbo.vw_ai_x` → `vw_ai_x`），要求以 `vw_ai_` 开头或为已声明的 CTE 名。
 *
 * 与旧实现的关键差异：
 *   1. 逗号连接（`FROM a, b`）同样被扫描 —— 旧实现只看紧跟 FROM/JOIN 的一个名字
 *   2. `[t]` / `"t"` / `[dbo].[t]` 统一按标识符处理 —— 不再依赖正则分支
 *   3. `FROM` 后直接跟 `(`（派生表）或字符串 → 交由调用方按「无法识别」拒绝
 */
function extractTableRefs(sql: string): string[] {
  const tokens = tokenizeSql(sql);
  const refs: string[] = [];

  /** 读标识符链（a.b.c），返回最后一段与下一位置 */
  const readIdentChain = (start: number): { name: string; next: number } | null => {
    let j = start;
    let last: string | null = null;
    while (j < tokens.length) {
      const tk = tokens[j]!;
      if (tk.kind !== "ident") break;
      last = tk.value;
      j++;
      if (tokens[j]?.kind === "punct" && tokens[j]!.value === ".") { j++; continue; }
      break;
    }
    return last === null ? null : { name: last, next: j };
  };

  for (let k = 0; k < tokens.length; k++) {
    const tk = tokens[k]!;
    if (!(tk.kind === "ident" && TABLE_INTRODUCERS.has(tk.value.toLowerCase()))) continue;

    // 引出词之后：跳过可能出现的括号（派生表）与字符串（非法表名）
    let j = k + 1;
    while (j < tokens.length) {
      const t2 = tokens[j]!;
      if (t2.kind === "punct" && t2.value === "(") { j++; continue; }
      if (t2.kind === "other") { j++; continue; }
      break;
    }

    const first = readIdentChain(j);
    if (first) {
      refs.push(first.name);
      j = first.next;
    } else if (j < tokens.length) {
      // 无法识别表名（如 FROM 后直接是 SELECT）→ 记空串，由调用方判为非法
      refs.push("");
      continue;
    }

    // 吃同一子句内的逗号连接
    while (true) {
      if (!(tokens[j]?.kind === "punct" && tokens[j]!.value === ",")) break;
      // 若逗号属于 SELECT 列表或函数参数，则不是表连接 → 停止
      let isClauseEnd = false;
      for (let b = j - 1; b >= 0; b--) {
        const tb = tokens[b]!;
        if (tb.kind === "punct" && (tb.value === "(" || tb.value === ")")) { isClauseEnd = true; break; }
        if (tb.kind === "ident" && CLAUSE_ENDERS.test(tb.value)) { isClauseEnd = true; break; }
        if (tb.kind === "ident" && TABLE_INTRODUCERS.has(tb.value.toLowerCase())) break;
      }
      if (isClauseEnd) break;

      const nxt = readIdentChain(j + 1);
      if (!nxt) break;
      refs.push(nxt.name);
      j = nxt.next;
    }
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
    const re = new RegExp(`\\b${kw.replace("_", "[_]")}\\b`, "i");
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

  // ★ 提取 CTE 名称（WITH xxx AS ...），CTE 名允许出现在 FROM/JOIN 中
  const cteNames = new Set<string>();
  const cteRe = /\bWITH\s+([A-Za-z_][A-Za-z0-9_]*)\s+AS\s*\(/gi;
  for (const m of sql.matchAll(cteRe)) {
    cteNames.add(m[1]!.toLowerCase());
  }
  const cteChainRe = /,\s*([A-Za-z_][A-Za-z0-9_]*)\s+AS\s*\(/gi;
  for (const m of sql.matchAll(cteChainRe)) {
    cteNames.add(m[1]!.toLowerCase());
  }

  // ★ vw_ai_* 白名单门禁（fail-closed）
  const tableRefs = extractTableRefs(sql);
  for (const ref of tableRefs) {
    const name = ref.toLowerCase();
    if (!name.startsWith("vw_ai_") && !cteNames.has(name)) {
      const shown = ref === "" ? "(无法识别的表引用)" : ref;
      throw new AnalysisError(
        ErrorCode.POLICY_VIOLATION,
        `SQL 模板 ${t.id} 引用了非 vw_ai_* 视图/表「${shown}」——只允许查询 vw_ai_* 视图`,
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
  // P1-A：必须是「有限的正整数」——仅 > 0 会放过 1.5（小数进入 TOP()）与 Infinity
  if (requestedMaxRows !== undefined && !(Number.isInteger(requestedMaxRows) && requestedMaxRows > 0)) {
    throw new AnalysisError(
      ErrorCode.VALIDATION_ERROR,
      `SQL 模板 ${t.id} 的 requestedMaxRows 必须为正整数（收到 ${requestedMaxRows}）`,
    );
  }
  const maxRows = Math.min(requestedMaxRows ?? t.max_rows, t.max_rows);
  return {
    sql: t.sql,
    values: { ...filled, max_rows: maxRows },
    max_rows: maxRows,
    timeout_ms: t.timeout_ms,
  };
}
