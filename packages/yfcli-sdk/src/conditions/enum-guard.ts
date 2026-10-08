/**
 * 枚举编码守卫 —— 拦截易飞最危险的静默错误。
 *
 * 实测证据（docs/plans/yf-live-probe-report.md §五，该账套共 50 张凭证）：
 * | conditions 传值 | total_result |
 * |---|---|
 * | 无条件 | 50 |
 * | approve_status = "Y.已审核"（回参原样） | **0** |
 * | approve_status = "Y"（仅编码） | 50 |
 * | approve_status = ""（空串） | 0 |
 *
 * 危险点：`code=0` 不报错，返回空集。Agent 若照搬上一步查询的回参值作为下一步条件，
 * 会得到「查无数据」的错误结论而不自知。
 *
 * 数字型枚举（flag=1 / flag=2）无此问题，纯数字不含分隔符。
 */

import { YF_CODE_TEXT_SEPARATOR } from '../types/domain.js';
import type { YfEnumFieldSpec } from '../types/domain.js';

/**
 * 判定一个字符串是否为「编码.中文」形态。
 *
 * 规则：恰好一个分隔符，左侧为纯编码（不含空格），右侧为中文描述。
 * 只含单个分隔符 —— 若值本身含多个点（如日期串），不做判定，避免误报。
 */
export function looksLikeCodeText(value: string): boolean {
  const parts = value.split(YF_CODE_TEXT_SEPARATOR);
  if (parts.length !== 2) return false;
  const [code, label] = parts;
  if (code === undefined || label === undefined) return false;
  if (code.length === 0 || label.length === 0) return false;
  // 编码段不允许含空格（真实编码如 Y / N / 01 / 001）
  if (/\s/.test(code)) return false;
  // 描述段须含至少一个非 ASCII 字符（中文），否则可能是普通带点文本
  return /[^\x00-\x7F]/.test(label);
}

/**
 * 从「编码.中文」回参值中提取纯编码。
 *
 * 非该形态时原样返回 —— 调用方可据此判断是否需要告警。
 */
export function extractCode(value: string): string {
  if (!looksLikeCodeText(value)) return value;
  const [code] = value.split(YF_CODE_TEXT_SEPARATOR);
  return code ?? value;
}

/**
 * 枚举条件值的校验结果。
 *
 * 不用抛错：调用方可能有意传非枚举字段，
 * 故返回结构让调用方决定是拒绝还是仅告警。
 */
export interface YfEnumGuardVerdict {
  /** 建议实际使用的值（已剥离「.中文」后缀）。 */
  readonly correctedValue: string;
  /** 是否检测到「编码.中文」形态。 */
  readonly suspect: boolean;
  /** 面向使用者的说明。 */
  readonly reason: string;
}

/** 字段无枚举元数据时的默认判定：仅形态可疑时告警，不阻断。 */
const DEFAULT_FIELD_SPEC: YfEnumFieldSpec = { fieldName: '<未登记字段>', codedText: true };

/**
 * 校验一个枚举型查询条件值。
 *
 * `enforce` 为 true 时检测到可疑形态即抛错（推荐用于写脚本与 CI）；
 * 为 false 时仅返回 verdict 供调用方告警（推荐用于交互式查询）。
 */
export function guardEnumConditionValue(
  spec: YfEnumFieldSpec = DEFAULT_FIELD_SPEC,
  value: string,
  enforce: boolean,
): YfEnumGuardVerdict {
  if (value === '') {
    const reason =
      `${spec.fieldName} 传入空串。易飞对空串枚举条件返回 code=0 + 0 条（不报错），` +
      '属静默错误。若意图是取全量，请不要传该条件。';
    if (enforce) throw new TypeError(reason);
    return { correctedValue: value, suspect: true, reason };
  }

  if (!spec.codedText) {
    return { correctedValue: value, suspect: false, reason: '' };
  }

  if (!looksLikeCodeText(value)) {
    return { correctedValue: value, suspect: false, reason: '' };
  }

  const reason =
    `${spec.fieldName} 传入的是回参形态「${value}」。` +
    '易飞文本型枚举的回参为「编码.中文」，但作为 query 条件只认纯编码 —— ' +
    `应传 "${extractCode(value)}"。传入完整串会返回 code=0 + 0 条，不报错，属静默错误。`;

  if (enforce) throw new TypeError(reason);
  return { correctedValue: extractCode(value), suspect: true, reason };
}

/**
 * 批量校正枚举条件字段值。
 *
 * 就地不可变返回新数组；仅对 `codedText` 为 true 且形态可疑的字段生效。
 */
export function correctEnumFields(
  fields: Readonly<Record<string, string>>,
  specLookup: Readonly<Record<string, YfEnumFieldSpec>>,
): {
  readonly corrected: Record<string, string>;
  readonly warnings: readonly string[];
} {
  const corrected: Record<string, string> = { ...fields };
  const warnings: string[] = [];

  for (const [fieldName, rawValue] of Object.entries(fields)) {
    const spec = specLookup[fieldName];
    if (spec === undefined) continue;
    const verdict = guardEnumConditionValue(spec, rawValue, false);
    if (!verdict.suspect) continue;
    corrected[fieldName] = verdict.correctedValue;
    warnings.push(verdict.reason);
  }

  return { corrected, warnings };
}