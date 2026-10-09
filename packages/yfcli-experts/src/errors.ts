/**
 * 专家模块异常
 *
 * 公式错误时抛出此异常，不静默返回 0。
 * 携带口径信息，让调用方知道「这个结果是在什么口径下算出来的」。
 */
import type { CaliberTag } from "./types.js";

export class ExpertError extends Error {
  public readonly formulaId: string;
  public readonly expectedInput: string;
  public readonly actualInput: string;
  public readonly caliberDescription: string;

  constructor(params: {
    formulaId: string;
    message: string;
    expectedInput: string;
    actualInput: string;
    caliber: CaliberTag;
  }) {
    super(
      `[ExpertError] ${params.formulaId}: ${params.message} ` +
        `(期望: ${params.expectedInput}, 实际: ${params.actualInput}, ` +
        `口径: ${params.caliber.description})`,
    );
    this.name = "ExpertError";
    this.formulaId = params.formulaId;
    this.expectedInput = params.expectedInput;
    this.actualInput = params.actualInput;
    this.caliberDescription = params.caliber.description;
  }
}
