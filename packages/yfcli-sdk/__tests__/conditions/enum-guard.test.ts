import { describe, it, expect } from 'vitest';
import {
  looksLikeCodeText,
  extractCode,
  guardEnumConditionValue,
  correctEnumFields,
  extractCodeAgainstSet,
} from '../../src/conditions/enum-guard.js';
import type { YfEnumFieldSpec } from '../../src/types/domain.js';

describe('looksLikeCodeText', () => {
  it('"Y.已审核" is code-text', () => {
    expect(looksLikeCodeText('Y.已审核')).toBe(true);
  });

  it('"N.未过账" is code-text', () => {
    expect(looksLikeCodeText('N.未过账')).toBe(true);
  });

  it('"1.一般凭证输入" is code-text', () => {
    expect(looksLikeCodeText('1.一般凭证输入')).toBe(true);
  });

  it('pure code "Y" is NOT code-text', () => {
    expect(looksLikeCodeText('Y')).toBe(false);
  });

  it('empty string is NOT code-text', () => {
    expect(looksLikeCodeText('')).toBe(false);
  });

  it('"hello.world" (no CJK) is NOT code-text', () => {
    expect(looksLikeCodeText('hello.world')).toBe(false);
  });

  it('"a.b.c" (multiple dots) is NOT code-text', () => {
    expect(looksLikeCodeText('a.b.c')).toBe(false);
  });

  it('code with space is NOT code-text', () => {
    expect(looksLikeCodeText('Y Z.已审核')).toBe(false);
  });
});

describe('extractCode', () => {
  it('"Y.已审核" -> "Y"', () => {
    expect(extractCode('Y.已审核')).toBe('Y');
  });

  it('"N.未过账" -> "N"', () => {
    expect(extractCode('N.未过账')).toBe('N');
  });

  it('pure code "Y" stays "Y"', () => {
    expect(extractCode('Y')).toBe('Y');
  });

  it('non-code-text passes through unchanged', () => {
    expect(extractCode('hello')).toBe('hello');
  });
});

describe('guardEnumConditionValue', () => {
  const spec: YfEnumFieldSpec = { fieldName: 'approve_status', codedText: true };

  it('detects and corrects "Y.已审核" in non-enforce mode', () => {
    const v = guardEnumConditionValue(spec, 'Y.已审核', false);
    expect(v.suspect).toBe(true);
    expect(v.correctedValue).toBe('Y');
    expect(v.reason).toContain('approve_status');
  });

  it('throws on "Y.已审核" in enforce mode', () => {
    expect(() => guardEnumConditionValue(spec, 'Y.已审核', true)).toThrow(TypeError);
  });

  it('passes pure code "Y" without warning', () => {
    const v = guardEnumConditionValue(spec, 'Y', false);
    expect(v.suspect).toBe(false);
    expect(v.correctedValue).toBe('Y');
  });

  it('warns on empty string', () => {
    const v = guardEnumConditionValue(spec, '', false);
    expect(v.suspect).toBe(true);
    expect(v.reason).toContain('空串');
  });

  it('skips non-codedText fields', () => {
    const numSpec: YfEnumFieldSpec = { fieldName: 'flag', codedText: false };
    const v = guardEnumConditionValue(numSpec, '1.2.3', false);
    expect(v.suspect).toBe(false);
  });
});

describe('correctEnumFields', () => {
  it('corrects suspect fields and returns warnings', () => {
    const fields = { approve_status: 'Y.已审核', item_no: '001' };
    const specs: Record<string, YfEnumFieldSpec> = {
      approve_status: { fieldName: 'approve_status', codedText: true },
    };
    const result = correctEnumFields(fields, specs);
    expect(result.corrected.approve_status).toBe('Y');
    expect(result.corrected.item_no).toBe('001');
    expect(result.warnings).toHaveLength(1);
  });

  it('returns original values when no suspects', () => {
    const fields = { approve_status: 'Y' };
    const specs: Record<string, YfEnumFieldSpec> = {
      approve_status: { fieldName: 'approve_status', codedText: true },
    };
    const result = correctEnumFields(fields, specs);
    expect(result.corrected.approve_status).toBe('Y');
    expect(result.warnings).toHaveLength(0);
  });
});

/**
 * 「编码 + 点、无中文」形态 —— 真机实测的新形态（2026-10-10）。
 *
 * sales.order 的 approve_status 回参是 "Y." / "N." / "U"，即
 * **编码后跟一个裸点，点后无中文描述**。此前的 looksLikeCodeText 要求
 * 点后必须含非 ASCII 字符，因此对该形态判 false，守卫完全失效：
 * Agent 把回参 "Y." 当条件回传 → 服务端精确匹配不到 "Y."（库里存的是 "Y"）
 * → 返回 code=0 + 0 条，静默错误。
 *
 * 注意与「日期串」的区分：日期形如 "20240703"（无点）或用 "-" 分隔，
 * 不会是一个短编码 + 尾点。
 */
describe('looksLikeCodeText —— 尾点形态', () => {
  it('"Y." is code-text', () => {
    expect(looksLikeCodeText('Y.')).toBe(true);
  });

  it('"N." is code-text', () => {
    expect(looksLikeCodeText('N.')).toBe(true);
  });

  it('"U." is code-text', () => {
    expect(looksLikeCodeText('U.')).toBe(true);
  });

  it('"1." is code-text', () => {
    expect(looksLikeCodeText('1.')).toBe(true);
  });

  it('"." (bare dot) is NOT code-text', () => {
    expect(looksLikeCodeText('.')).toBe(false);
  });

  it('"." prefixed ".Y" (empty code) is NOT code-text', () => {
    expect(looksLikeCodeText('.Y')).toBe(false);
  });

  it('date-like "2024.07.03" (multiple dots) is NOT code-text', () => {
    expect(looksLikeCodeText('2024.07.03')).toBe(false);
  });

  it('long dotted text "a.b.c" still NOT code-text', () => {
    expect(looksLikeCodeText('a.b.c')).toBe(false);
  });
});

describe('extractCode —— 尾点形态', () => {
  it('"Y." -> "Y"', () => {
    expect(extractCode('Y.')).toBe('Y');
  });

  it('"N." -> "N"', () => {
    expect(extractCode('N.')).toBe('N');
  });

  it('"U." -> "U"', () => {
    expect(extractCode('U.')).toBe('U');
  });
});

describe('guardEnumConditionValue —— 尾点形态', () => {
  const spec: YfEnumFieldSpec = { fieldName: 'approve_status', codedText: true };

  it('detects and corrects "Y." in non-enforce mode', () => {
    const v = guardEnumConditionValue(spec, 'Y.', false);
    expect(v.suspect).toBe(true);
    expect(v.correctedValue).toBe('Y');
    expect(v.reason).toContain('approve_status');
  });

  it('throws on "Y." in enforce mode', () => {
    expect(() => guardEnumConditionValue(spec, 'Y.', true)).toThrow(TypeError);
  });
});

/**
 * 字典编码集判定 —— 区分「枚举 1.内含」与「数值 2.65」。
 *
 * 二者长相完全相同（都是「数字.数字/文字」），仅凭形态无法判断。
 * 唯一可靠判据：点前部分是否为该字段枚举字典中登记的合法编码。
 */
describe('extractCodeAgainstSet', () => {
  const taxCodes = new Set(['1', '2', '3', '4']);

  it('"1.内含" with tax_type codes -> "1"', () => {
    expect(extractCodeAgainstSet('1.内含', taxCodes)).toBe('1');
  });

  it('"2" (pure code) is NOT stripped -> undefined', () => {
    expect(extractCodeAgainstSet('2', taxCodes)).toBeUndefined();
  });

  it('"2.65" (numeric decimal, 2 not a code) -> undefined', () => {
    expect(extractCodeAgainstSet('2.65', new Set(['1', '3']))).toBeUndefined();
  });

  it('"0.ERP" with source_code codes -> "0"', () => {
    expect(extractCodeAgainstSet('0.ERP', new Set(['0', '1', '2']))).toBe('0');
  });

  it('empty string -> undefined', () => {
    expect(extractCodeAgainstSet('', taxCodes)).toBeUndefined();
  });

  it('".Y" (leading dot) -> undefined', () => {
    expect(extractCodeAgainstSet('.Y', taxCodes)).toBeUndefined();
  });
});

describe('guardEnumConditionValue —— 带 codes 的精确判定', () => {
  it('tax_type "1.内含" is corrected to "1"', () => {
    const spec: YfEnumFieldSpec = { fieldName: 'tax_type', codedText: true, codes: new Set(['1', '2']) };
    const v = guardEnumConditionValue(spec, '1.内含', false);
    expect(v.suspect).toBe(true);
    expect(v.correctedValue).toBe('1');
  });

  it('数值小数 "2.65" 不被当作枚举剥离（关键回归）', () => {
    const spec: YfEnumFieldSpec = { fieldName: 'tax_type', codedText: true, codes: new Set(['1', '3']) };
    const v = guardEnumConditionValue(spec, '2.65', false);
    expect(v.suspect).toBe(false);
    expect(v.correctedValue).toBe('2.65');
  });

  it('approve_status "Y." with codes -> "Y"', () => {
    const spec: YfEnumFieldSpec = { fieldName: 'approve_status', codedText: true, codes: new Set(['Y', 'N', 'U', 'V']) };
    const v = guardEnumConditionValue(spec, 'Y.', false);
    expect(v.suspect).toBe(true);
    expect(v.correctedValue).toBe('Y');
  });
});