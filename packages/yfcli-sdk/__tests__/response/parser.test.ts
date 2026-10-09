import { describe, it, expect } from 'vitest';
import {
  isSuccessCode,
  parseEnvelope,
  parseErrorEntries,
  buildBusinessError,
  parseQueryResult,
  parseActionResult,
  describeEmptyResultWarning,
} from '../../src/response/parser.js';
import { YfError } from '../../src/types/errors.js';

describe('isSuccessCode', () => {
  it('"0" is success', () => expect(isSuccessCode('0')).toBe(true));
  it('"-0" is success', () => expect(isSuccessCode('-0')).toBe(true));
  it('"-1" is not success', () => expect(isSuccessCode('-1')).toBe(false));
  it('description text is not success check', () => {
    // Must NOT match description strings
    expect(isSuccessCode('查詢成功')).toBe(false);
    expect(isSuccessCode('执行成功')).toBe(false);
  });
});

describe('parseEnvelope', () => {
  it('parses valid envelope', () => {
    const body = {
      std_data: {
        execution: { code: '0', sql_code: '', description: '查詢成功' },
        parameter: { result: { rows: [{ a: 1 }] } },
      },
    };
    const env = parseEnvelope(body);
    expect(env.std_data.execution.code).toBe('0');
  });

  it('throws on non-object body', () => {
    expect(() => parseEnvelope(null)).toThrow(YfError);
    expect(() => parseEnvelope('string')).toThrow(YfError);
  });

  it('throws on missing std_data', () => {
    expect(() => parseEnvelope({ foo: 'bar' })).toThrow(/std_data/);
  });

  it('throws on missing execution', () => {
    expect(() => parseEnvelope({ std_data: {} })).toThrow(/execution/);
  });

  it('throws on non-string code', () => {
    expect(() =>
      parseEnvelope({ std_data: { execution: { code: 0 } } }),
    ).toThrow(/execution.code/);
  });
});

describe('parseErrorEntries', () => {
  it('parses structure A: { message, data }', () => {
    const param = {
      result: {
        error: [
          { message: '缺少主键', data: { doc_no: '001' } },
        ],
      },
    };
    const entries = parseErrorEntries(param as any);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.message).toBe('缺少主键');
    expect(entries[0]!.data).toEqual({ doc_no: '001' });
  });

  it('parses structure B: { information: [{ message, data }] }', () => {
    const param = {
      result: {
        error: [
          {
            information: [
              { message: '批量错误1', data: { id: 1 } },
              { message: '批量错误2' },
            ],
          },
        ],
      },
    };
    const entries = parseErrorEntries(param as any);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.message).toBe('批量错误1');
    expect(entries[1]!.message).toBe('批量错误2');
  });

  it('throws on unrecognized error structure (WARN defense)', () => {
    const param = {
      result: {
        error: [{ weird_field: 'unexpected' }],
      },
    };
    expect(() => parseErrorEntries(param as any)).toThrow(/无法识别/);
  });

  it('returns empty array for no errors', () => {
    expect(parseErrorEntries(undefined)).toEqual([]);
    expect(parseErrorEntries({} as any)).toEqual([]);
  });
});

describe('buildBusinessError', () => {
  it('builds error from envelope with error details', () => {
    const envelope = {
      std_data: {
        execution: { code: '-1', sql_code: '', description: 'conditions not found.' },
        parameter: {
          result: {
            error: [{ message: 'conditions not found.', data: {} }],
          },
        },
      },
    };
    const err = buildBusinessError(envelope as any);
    expect(err).toBeInstanceOf(YfError);
    expect(err.kind).toBe('conditions_invalid');
    expect(err.layer).toBe('business');
  });
});

describe('parseQueryResult', () => {
  it('extracts rows and pagination info', () => {
    const param = {
      total_result: 50,
      has_next: true,
      result: { cnt: 10, rows: [{ a: 1 }, { a: 2 }] },
    };
    const r = parseQueryResult(param as any);
    expect(r.rows).toHaveLength(2);
    expect(r.totalResult).toBe(50);
    expect(r.hasNext).toBe(true);
    expect(r.count).toBe(10);
  });

  it('handles missing parameter gracefully', () => {
    const r = parseQueryResult(undefined);
    expect(r.rows).toEqual([]);
    expect(r.hasNext).toBe(false);
  });
});

describe('parseActionResult', () => {
  it('returns items when success array present', () => {
    const param = { result: { success: [{ doc_no: '001' }] } };
    const r = parseActionResult(param as any, 'test.service');
    expect(r.empty).toBe(false);
    expect(r.items).toHaveLength(1);
  });

  it('marks empty when success array is empty', () => {
    const param = { result: { success: [] } };
    const r = parseActionResult(param as any, 'test.service');
    expect(r.empty).toBe(true);
  });

  it('marks empty when no success key', () => {
    const r = parseActionResult(undefined, 'test.service');
    expect(r.empty).toBe(true);
  });
});

describe('describeEmptyResultWarning', () => {
  it('includes service name and primary key hint', () => {
    const msg = describeEmptyResultWarning('yf.oapi.sales.order.read.get', ['doc_type_no', 'doc_no']);
    expect(msg).toContain('yf.oapi.sales.order.read.get');
    expect(msg).toContain('doc_type_no + doc_no');
  });
});
