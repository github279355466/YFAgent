/**
 * L4 审计日志模块（易飞版 · B 方案四层防护之 L4）
 *
 * 每次 SQL 执行前后记录完整上下文，作为分析层安全底线。
 * 设计原则：
 *   - 审计日志不能影响正常执行流程（sink 异常 catch 住打 warn）
 *   - 参数脱敏：敏感字段掩码 + 长字符串截断
 *   - sink 可插拔：console / file / memory（测试用）/ 自定义
 */
import { appendFileSync } from "node:fs";

export interface AuditEntry {
  /** ISO 8601 时间戳 */
  timestamp: string;
  /** 执行的模板 ID */
  templateId: string;
  /** 数据源 ID（可选） */
  dataSourceId?: string;
  /** 参数（脱敏后） */
  params: Record<string, unknown>;
  /** 返回行数 */
  rowCount: number;
  /** 执行耗时（毫秒） */
  durationMs: number;
  /** 执行状态 */
  status: "success" | "error";
  /** 错误信息（截断到 200 字符） */
  error?: string;
  /** 用户标识（可选） */
  userId?: string;
}

export type AuditSink = (entry: AuditEntry) => void;

/** 敏感字段名模式（不区分大小写） */
const SENSITIVE_PATTERN = /password|token|secret/i;

/** 长字符串截断阈值 */
const MAX_PARAM_LENGTH = 50;

/** 错误信息截断阈值 */
const MAX_ERROR_LENGTH = 200;

/**
 * 参数脱敏：
 *   - 参数名匹配 password/token/secret → 值替换为 '***'
 *   - 字符串值长度 > 50 → 截断到 50 + '...'
 */
export function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_PATTERN.test(key)) {
      result[key] = "***";
    } else if (typeof value === "string" && value.length > MAX_PARAM_LENGTH) {
      result[key] = value.slice(0, MAX_PARAM_LENGTH) + "...";
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** 截断错误信息 */
export function truncateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.length > MAX_ERROR_LENGTH ? msg.slice(0, MAX_ERROR_LENGTH) + "..." : msg;
}

/** 默认 sink：console.log JSON */
export function consoleAuditSink(entry: AuditEntry): void {
  console.log(JSON.stringify(entry));
}

/** 文件 sink：追加写入 JSONL 文件 */
export function fileAuditSink(filePath: string): AuditSink {
  return (entry: AuditEntry) => {
    appendFileSync(filePath, JSON.stringify(entry) + "\n", "utf8");
  };
}

/** 内存 sink：用于测试 */
export function memoryAuditSink(): { sink: AuditSink; entries: AuditEntry[] } {
  const entries: AuditEntry[] = [];
  return {
    sink: (entry: AuditEntry) => {
      entries.push(entry);
    },
    entries,
  };
}
