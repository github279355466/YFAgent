import { describe, it, expect } from 'vitest';
import {
  looksLikeCodeText,
  extractCode,
  guardEnumConditionValue,
  correctEnumFields,
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
