import { describe, it, expect } from 'vitest';
import {
  allRecords,
  field,
  compositeField,
  allOf,
  anyOf,
  between,
  inList,
  notInList,
  like,
  exists,
  notExists,
  pagination,
  queryParameter,
  asc,
  desc,
  assertNotYiZhuConditionsShape,
} from '../../src/conditions/builder.js';

describe('allRecords', () => {
  it('returns empty AND group', () => {
    const cond = allRecords();
    expect(cond).toEqual({ operator: 'and', fields: [] });
  });
});

describe('field', () => {
  it('constructs a simple condition', () => {
    const f = field('item_no', '=', '001');
    expect(f).toEqual({ field_name: 'item_no', operator: '=', value: '001' });
  });

  it('includes node_name when provided', () => {
    const f = field('project_code', '=', '00181', 'sales_order_detail_data');
    expect(f).toEqual({
      field_name: 'project_code',
      operator: '=',
      value: '00181',
      node_name: 'sales_order_detail_data',
    });
  });

  it('EXISTS requires empty field_name', () => {
    expect(() => field('some_field', 'EXISTS', '(SELECT 1)')).toThrow(TypeError);
  });

  it('non-EXISTS requires non-empty field_name', () => {
    expect(() => field('', '=', 'val')).toThrow(TypeError);
  });
});

describe('compositeField', () => {
  it('joins fields with +', () => {
    const f = compositeField(['doc_type_no', 'doc_no'], '=', 'A001');
    expect(f.field_name).toBe('doc_type_no+doc_no');
    expect(f.value).toBe('A001');
  });

  it('rejects empty field list', () => {
    expect(() => compositeField([], '=', 'v')).toThrow(TypeError);
  });
});

describe('allOf / anyOf', () => {
  it('allOf creates AND group', () => {
    const g = allOf([field('a', '=', '1'), field('b', '=', '2')]);
    expect(g.operator).toBe('and');
    expect(g.fields).toHaveLength(2);
  });

  it('anyOf creates OR group', () => {
    const g = anyOf([field('a', '=', '1')]);
    expect(g.operator).toBe('or');
  });
});

describe('between', () => {
  it('formats value as SQL BETWEEN fragment', () => {
    const f = between('doc_date', '20240101', '20241231');
    expect(f.operator).toBe('BETWEEN');
    expect(f.value).toBe("'20240101' AND '20241231'");
  });

  it('rejects empty from/to', () => {
    expect(() => between('f', '', 'end')).toThrow(TypeError);
    expect(() => between('f', 'start', '')).toThrow(TypeError);
  });
});

describe('inList', () => {
  it('formats value as (N\'...\',N\'...\') shape', () => {
    const f = inList('status', ['000', '001', '002']);
    expect(f.operator).toBe('IN');
    expect(f.value).toBe("('000','001','002')");
  });

  it('rejects empty list', () => {
    expect(() => inList('status', [])).toThrow(TypeError);
  });
});

describe('notInList', () => {
  it('formats NOT IN value', () => {
    const f = notInList('flag', ['X', 'Y']);
    expect(f.operator).toBe('NOT IN');
    expect(f.value).toBe("('X','Y')");
  });

  it('rejects empty list', () => {
    expect(() => notInList('flag', [])).toThrow(TypeError);
  });
});

describe('like', () => {
  it('passes pattern as value', () => {
    const f = like('item_no', '00%');
    expect(f.operator).toBe('LIKE');
    expect(f.value).toBe('00%');
  });

  it('rejects empty pattern', () => {
    expect(() => like('item_no', '')).toThrow(TypeError);
  });
});

describe('exists / notExists', () => {
  it('exists has empty field_name', () => {
    const f = exists('(SELECT 1 FROM $$INVMB WHERE MB001 = item_no)');
    expect(f.field_name).toBe('');
    expect(f.operator).toBe('EXISTS');
  });

  it('notExists has empty field_name', () => {
    const f = notExists('(SELECT 1)');
    expect(f.field_name).toBe('');
    expect(f.operator).toBe('NOT EXISTS');
  });
});

describe('pagination', () => {
  it('constructs valid pagination', () => {
    const p = pagination(1, 100);
    expect(p).toEqual({ page_no: 1, page_size: 100, use_has_next: true });
  });

  it('rejects page_no < 1', () => {
    expect(() => pagination(0, 100)).toThrow(TypeError);
  });

  it('rejects page_size > 10000', () => {
    expect(() => pagination(1, 10001)).toThrow(TypeError);
  });

  it('rejects non-integer page_no', () => {
    expect(() => pagination(1.5, 100)).toThrow(TypeError);
  });
});

describe('queryParameter', () => {
  it('assembles query parameter with conditions and page', () => {
    const qp = queryParameter({
      conditions: allRecords(),
      page: pagination(1, 50),
    });
    expect(qp.conditions).toEqual(allRecords());
    expect(qp.page_no).toBe(1);
    expect(qp.page_size).toBe(50);
  });

  it('includes orders when provided', () => {
    const qp = queryParameter({
      conditions: allRecords(),
      page: pagination(1, 50),
      orders: [asc('item_no'), desc('create_date')],
    });
    expect(qp.orders).toHaveLength(2);
  });
});

describe('assertNotYiZhuConditionsShape', () => {
  it('throws on array with groups (YiZhu shape)', () => {
    const yiZhuShape = [{ groups: [{ fields: [] }] }];
    expect(() => assertNotYiZhuConditionsShape(yiZhuShape)).toThrow(/易助形态/);
  });

  it('throws on flat array', () => {
    const flatArray = [{ field: 'a', op: '=', value: '1' }];
    expect(() => assertNotYiZhuConditionsShape(flatArray)).toThrow(/扁平数组/);
  });

  it('does not throw on valid object shape', () => {
    expect(() => assertNotYiZhuConditionsShape({ operator: 'and', fields: [] })).not.toThrow();
  });
});
