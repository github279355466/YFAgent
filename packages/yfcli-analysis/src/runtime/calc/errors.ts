/**
 * yfcli-analysis 包内使用的错误类型。
 *
 * 与 YZCLI 的 AnalysisError 保持同构命名，但本包不引入对 yzcli-analysis 的运行时依赖。
 */

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  POLICY_VIOLATION: "POLICY_VIOLATION",
  EXECUTION_ERROR: "EXECUTION_ERROR",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AnalysisError extends Error {
  readonly code: ErrorCodeValue;
  constructor(code: ErrorCodeValue, message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}
