/**
 * yfcli-analysis 包入口
 *
 * 导出：
 *   - SQL 模板注册制（template.ts）
 *   - 执行器防护（executor.ts）
 *   - 配置管理（config.ts）
 *   - ★ L4 审计日志（audit.ts）
 *   - 生产 MSSQL Driver（driver.ts）
 *   - 内置模板库（templates.ts）
 *   - 智能问数路由（qa/smart-query.ts）
 */

// 核心类型与工具
export {
  type SqlParamType,
  type SqlParamDef,
  type SqlTemplate,
  type RenderedSql,
  defineTemplate,
  validateTemplate,
  renderSql,
  SqlTemplateRegistry,
} from "./runtime/sql/template.js";

// 执行器
export {
  type SqlDriver,
  type SqlExecutorOptions,
  SqlExecutor,
} from "./runtime/sql/executor.js";

// 配置
export {
  type SqlDataSourceConfig,
  type SqlConfig,
  type SqlAuditConfig,
  type ResolvedCredentials,
  loadSqlConfig,
  validateSqlConfig,
  resolveCredentials,
  getDataSourceConfig,
} from "./runtime/sql/config.js";

// ★ L4 审计日志
export {
  type AuditEntry,
  type AuditSink,
  consoleAuditSink,
  fileAuditSink,
  memoryAuditSink,
  sanitizeParams,
  truncateError,
} from "./runtime/sql/audit.js";

// 生产 MSSQL Driver
export {
  type MssqlDriverOptions,
  MssqlDriver,
  createMssqlDriverFromEnv,
  convertPlaceholders,
} from "./runtime/sql/driver.js";

// 内置模板
export { BUILTIN_TEMPLATES } from "./runtime/sql/templates.js";

// 智能问数
export {
  routeQuestion,
  extractParams,
  executeAndFormat,
  type RouteResult,
  type QueryResult,
} from "./qa/smart-query.js";

// 错误类型
export { AnalysisError, ErrorCode, type ErrorCodeValue } from "./runtime/calc/errors.js";
