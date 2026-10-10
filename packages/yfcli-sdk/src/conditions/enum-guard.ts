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
 * 判定一个字符串是否为需要剥离的「编码+描述」形态。
 *
 * 覆盖两种真机实测形态（2026-10-09 与 2026-10-10 两次采样）：
 *
 *   1. `编码.中文` —— 如 `Y.已审核` / `1.一般凭证输入`（点后为中文描述）
 *   2. `编码.`     —— 如 `Y.` / `N.` / `U.`（**点后为空**，sales.order 的 approve_status 即此形态）
 *
 * 形态 2 是 2026-10-10 新发现的漏网形态：点后无中文，早先的实现据此判 false，
 * 守卫完全失效 —— Agent 把回参 `"Y."` 当条件回传，服务端精确匹配不到（库里是 `"Y"`），
 * 静默返回 code=0 + 0 条。
 *
 * 排除项（避免误伤真实业务值）：
 *   - 空串、单个裸点 `.`、点后为空但点前也为空 `.Y`
 *   - 含多个点的值（如 `2024.07.03` 及长串 `a.b.c`）—— 只认「至多一个点」
 *   - 编码段含空格
 *   - 点后有内容但不是中文（如 `hello.world`）—— 仅在点后非空时生效
 */
export function looksLikeCodeText(value: string): boolean {
  if (value === '') return false;

  const dotCount = value.split(YF_CODE_TEXT_SEPARATOR).length - 1;
  if (dotCount > 1) return false;

  const dotIndex = value.indexOf(YF_CODE_TEXT_SEPARATOR);

  // 形态 2：`编码.` —— 恰好一个尾点，点后为空
  if (dotIndex === value.length - 1 && dotIndex > 0) {
    const code = value.slice(0, dotIndex);
    // 编码段不允许含空格（真实编码如 Y / N / 01 / 001）
    return !/\s/.test(code);
  }

  // 形态 1：`编码.中文` —— 点后须含至少一个非 ASCII 字符
  const [code, label] = value.split(YF_CODE_TEXT_SEPARATOR);
  if (code === undefined || label === undefined) return false;
  if (code.length === 0 || label.length === 0) return false;
  if (/\s/.test(code)) return false;
  return /[^\x00-\x7F]/.test(label);
}

/**
 * 从「编码.描述」回参值中提取纯编码。
 *
 * 非该形态时原样返回 —— 调用方可据此判断是否需要告警。
 */
export function extractCode(value: string): string {
  if (!looksLikeCodeText(value)) return value;
  const [code] = value.split(YF_CODE_TEXT_SEPARATOR);
  return code ?? value;
}

/**
 * 在**已知合法编码集**的前提下判定是否应剥离后缀。
 *
 * 这是区分「枚举 `1.内含`」与「数值 `2.65`」的唯一可靠判据 —— 二者长相相同，
 * 但前者点前部分（`1`）是字典登记的合法编码，后者（`2`）不是。
 *
 * 返回点前编码；不可剥离时返回 undefined。
 */
export function extractCodeAgainstSet(
  value: string,
  codes: ReadonlySet<string>,
): string | undefined {
  if (value === '') return undefined;
  const dotIndex = value.indexOf(YF_CODE_TEXT_SEPARATOR);
  if (dotIndex <= 0) return undefined;
  // 允许多个点（如 "0.ERP.xx"），只取首段
  const code = value.slice(0, dotIndex);
  if (/\s/.test(code)) return undefined;
  return codes.has(code) ? code : undefined;
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
  /** 是否检测到可疑的「编码.描述」形态。 */
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

  // 有字典编码集时，以「点前是否为合法编码」为准 —— 可精确排除数值小数（2.65）。
  if (spec.codes !== undefined && spec.codes.size > 0) {
    const code = extractCodeAgainstSet(value, spec.codes);
    if (code === undefined) {
      return { correctedValue: value, suspect: false, reason: '' };
    }
    const reason =
      `${spec.fieldName} 传入的是回参形态「${value}」。` +
      '易飞文本型枚举的回参为「编码」或「编码.描述」，但作为 query 条件只认纯编码 —— ' +
      `应传 "${code}"。传入完整串会返回 code=0 + 0 条，不报错，属静默错误。`;
    if (enforce) throw new TypeError(reason);
    return { correctedValue: code, suspect: true, reason };
  }

  if (!looksLikeCodeText(value)) {
    return { correctedValue: value, suspect: false, reason: '' };
  }

  const reason =
    `${spec.fieldName} 传入的是回参形态「${value}」。` +
    '易飞文本型枚举的回参为「编码」或「编码.描述」（描述可缺省，形如 "Y."），' +
    '但作为 query 条件只认纯编码 —— ' +
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