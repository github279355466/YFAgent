import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { TypeKeyCatalog } from '../../src/catalog/typekey-catalog.js';
import { YfError } from '../../src/types/errors.js';
import { YfAmbiguousServiceError } from '../../src/types/errors.js';

/** Minimal YAML-like structure matching typekey_map.yaml output. */
function makeRaw(entries: Array<Record<string, unknown>>) {
  return { typekeys: entries };
}

const NORMAL_ENTRY = {
  type_key: 'sales.order',
  title: '销售订单',
  services: {
    query: 'yf.oapi.sales.order.data.query.get',
    read: 'yf.oapi.sales.order.data.read.get',
    create: 'yf.oapi.sales.order.data.create',
  },
  primary_key: ['doc_type_no', 'doc_no'],
  detail_nodes: ['sales_order_detail_data'],
};

const CONFLICT_ENTRY = {
  type_key: 'bom',
  title: '新增BOM',
  services: {
    query: 'yf.oapi.bom.data.query.get',
    read: 'yf.oapi.bom.data.read.get',
    create: 'yf.oapi.bom.create',
  },
  primary_key: ['master_item_no'],
  detail_nodes: ['bom_requirement_detail_data'],
  service_conflicts: [
    { op: 'query', kept: 'yf.oapi.bom.query.get', dropped: 'yf.oapi.bom.data.query.get' },
    { op: 'read', kept: 'yf.oapi.bom.read.get', dropped: 'yf.oapi.bom.data.read.get' },
  ],
};

const UNAVAILABLE_ENTRY = {
  type_key: 'broken.obj',
  title: '损坏对象',
  services: {},
  primary_key: [],
  detail_nodes: [],
  unavailable: true,
  unavailable_reason: '服务端 DLL 崩溃',
};

describe('TypeKeyCatalog', () => {
  describe('resolveServiceName', () => {
    it('resolves known type_key + operation', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      expect(catalog.resolveServiceName('sales.order', 'query')).toBe(
        'yf.oapi.sales.order.data.query.get',
      );
    });

    it('throws on unknown type_key', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      expect(() => catalog.resolveServiceName('nonexistent', 'query')).toThrow(YfError);
      expect(() => catalog.resolveServiceName('nonexistent', 'query')).toThrow(/不在/);
    });

    it('throws on unregistered operation for known type_key', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      expect(() => catalog.resolveServiceName('sales.order', 'invalid')).toThrow(YfError);
    });

    it('throws YfAmbiguousServiceError on conflicting operation', () => {
      const catalog = new TypeKeyCatalog(makeRaw([CONFLICT_ENTRY]));
      expect(() => catalog.resolveServiceName('bom', 'query')).toThrow(YfAmbiguousServiceError);
      try {
        catalog.resolveServiceName('bom', 'query');
      } catch (e) {
        const err = e as YfAmbiguousServiceError;
        expect(err.typeKey).toBe('bom');
        expect(err.operation).toBe('query');
        expect(err.candidates).toContain('yf.oapi.bom.query.get');
        expect(err.candidates).toContain('yf.oapi.bom.data.query.get');
      }
    });

    it('allows non-conflicting operations on same entry', () => {
      const catalog = new TypeKeyCatalog(makeRaw([CONFLICT_ENTRY]));
      // create has no conflict
      expect(catalog.resolveServiceName('bom', 'create')).toBe('yf.oapi.bom.create');
    });

    it('throws on unavailable type_key', () => {
      const catalog = new TypeKeyCatalog(makeRaw([UNAVAILABLE_ENTRY]));
      expect(() => catalog.resolveServiceName('broken.obj', 'query')).toThrow(/不可用/);
    });
  });

  describe('findEntry', () => {
    it('returns entry for known type_key', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      const entry = catalog.findEntry('sales.order');
      expect(entry).toBeDefined();
      expect(entry!.typeKey).toBe('sales.order');
    });

    it('returns undefined for unknown type_key', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      expect(catalog.findEntry('nope')).toBeUndefined();
    });
  });

  describe('listTypeKeys', () => {
    it('returns sorted list', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY, CONFLICT_ENTRY]));
      const keys = catalog.listTypeKeys();
      expect(keys).toEqual(['bom', 'sales.order']);
    });
  });

  describe('countServices', () => {
    it('counts unique service names', () => {
      const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
      expect(catalog.countServices()).toBe(3);
    });
  });

  describe('constructor validation', () => {
    it('throws on missing typekeys array', () => {
      expect(() => new TypeKeyCatalog({})).toThrow(/typekeys/);
    });

    it('throws on duplicate type_key', () => {
      expect(() =>
        new TypeKeyCatalog(makeRaw([NORMAL_ENTRY, NORMAL_ENTRY])),
      ).toThrow(/重复/);
    });

    it('throws on invalid raw structure', () => {
      expect(() => new TypeKeyCatalog(null)).toThrow();
      expect(() => new TypeKeyCatalog('string')).toThrow();
    });
  });
});

// ================================================================== 审核类额外键
// 真机 2026-10-10：sales.order 的 approve/disapprove 除业务主键外还需
// docdate + approvedate（typekey_map 的 primary_key 只登记前 2 个）。

const EXTRA_KEYS_ENTRY = {
  type_key: 'sales.order',
  title: '销售订单',
  services: {
    read: 'yf.oapi.sales.order.data.read.get',
    approve: 'yf.oapi.sales.order.data.approve',
    disapprove: 'yf.oapi.sales.order.data.disapprove',
  },
  primary_key: ['doc_type_no', 'doc_no'],
  detail_nodes: ['sales_order_data'],
  operation_extra_keys: {
    approve: ['docdate', 'approvedate'],
    disapprove: ['docdate', 'approvedate'],
  },
};

describe('operation_extra_keys（审核类额外键）', () => {
  it('解析 operation_extra_keys 并按操作暴露', () => {
    const catalog = new TypeKeyCatalog(makeRaw([EXTRA_KEYS_ENTRY]));
    const entry = catalog.findEntry('sales.order');
    expect(entry?.operationExtraKeys).toBeDefined();
    expect(entry?.operationExtraKeys?.approve).toEqual(['docdate', 'approvedate']);
    expect(entry?.operationExtraKeys?.disapprove).toEqual(['docdate', 'approvedate']);
  });

  it('requiredDataKeys 返回 主键 + 该操作的额外键（去重保序）', () => {
    const catalog = new TypeKeyCatalog(makeRaw([EXTRA_KEYS_ENTRY]));
    expect(catalog.requiredDataKeys('sales.order', 'approve')).toEqual([
      'doc_type_no',
      'doc_no',
      'docdate',
      'approvedate',
    ]);
    // read 无额外键 → 只回主键
    expect(catalog.requiredDataKeys('sales.order', 'read')).toEqual(['doc_type_no', 'doc_no']);
  });

  it('未登记额外键的对象退回纯主键', () => {
    const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
    expect(catalog.requiredDataKeys('sales.order', 'approve')).toEqual(['doc_type_no', 'doc_no']);
  });

  it('额外键与主键重复时不重复输出', () => {
    const dupEntry = {
      ...EXTRA_KEYS_ENTRY,
      operation_extra_keys: { approve: ['doc_no', 'docdate'] },
    };
    const catalog = new TypeKeyCatalog(makeRaw([dupEntry]));
    expect(catalog.requiredDataKeys('sales.order', 'approve')).toEqual([
      'doc_type_no',
      'doc_no',
      'docdate',
    ]);
  });

  it('未知 type_key 返回空数组（不抛错）', () => {
    const catalog = new TypeKeyCatalog(makeRaw([NORMAL_ENTRY]));
    expect(catalog.requiredDataKeys('not.exist', 'approve')).toEqual([]);
  });

  it('非法 operation 键被忽略', () => {
    const badEntry = {
      ...EXTRA_KEYS_ENTRY,
      operation_extra_keys: { approve: ['docdate'], bogus_op: ['x'], empty_arr: [] },
    };
    const catalog = new TypeKeyCatalog(makeRaw([badEntry]));
    const entry = catalog.findEntry('sales.order');
    expect(entry?.operationExtraKeys?.approve).toEqual(['docdate']);
    expect((entry?.operationExtraKeys as Record<string, unknown>)?.['bogus_op']).toBeUndefined();
    expect((entry?.operationExtraKeys as Record<string, unknown>)?.['empty_arr']).toBeUndefined();
  });
});
/**
 * 真机知识产物契约 —— 直接读 knowledge/typekey/typekey_map.yaml，
 * 锁定「审核类额外键」判别规则（真机实测 2026-10-10，15 对象 0 例外）：
 *
 *   主键含 doc_no → approve/disapprove 需 docdate + approvedate
 *   主键不含 doc_no（如 bom 的 master_item_no）→ 不需要
 *
 * 这是**防复发**关卡：若有人改了 scripts/extract-typekey-map.mjs 的
 * resolveExtraOperationKeys 使其偏离该规则，此用例会立即失败。
 */
describe('typekey_map.yaml 审核类额外键判别规则（真机契约）', () => {
  const MAP_PATH = resolve(process.cwd(), '..', '..', 'knowledge', 'typekey', 'typekey_map.yaml');

  function loadMap(): Array<Record<string, unknown>> {
    const text = readFileSync(MAP_PATH, 'utf-8');
    const doc = parse(text) as { typekeys?: Array<Record<string, unknown>> };
    return doc.typekeys ?? [];
  }

  it('主键含 doc_no 的对象都必须登记 approve/disapprove 额外键', () => {
    const entries = loadMap();
    const withDocNo = entries.filter((e) => {
      const pk = e['primary_key'];
      return Array.isArray(pk) && (pk as string[]).includes('doc_no');
    });
    // 真机口径：这类对象在本产物中应为 61 个（[口径：primary_key 含 doc_no 的对象数]）
    expect(withDocNo.length).toBeGreaterThan(50);

    const offenders = withDocNo.filter((e) => {
      const extra = e['operation_extra_keys'] as Record<string, string[]> | undefined;
      return !(
        extra?.approve?.includes('docdate') &&
        extra.approve.includes('approvedate') &&
        extra?.disapprove?.includes('docdate') &&
        extra.disapprove.includes('approvedate')
      );
    });
    expect(offenders.map((e) => e['type_key'])).toEqual([]);
  });

  it('主键不含 doc_no 的对象不应登记该额外键（避免过度拦截）', () => {
    const entries = loadMap();
    const withoutDocNo = entries.filter((e) => {
      const pk = e['primary_key'];
      return Array.isArray(pk) && !(pk as string[]).includes('doc_no');
    });
    const offenders = withoutDocNo.filter((e) => e['operation_extra_keys'] !== undefined);
    expect(offenders.map((e) => e['type_key'])).toEqual([]);
  });

  it('bom 是「单主键、不需要额外键」的对照样本', () => {
    const bom = loadMap().find((e) => e['type_key'] === 'bom');
    expect(bom).toBeDefined();
    expect(bom?.['primary_key']).toEqual(['master_item_no']);
    expect(bom?.['operation_extra_keys']).toBeUndefined();
  });

  it('sales.order 的 4 键要求保持稳定（原缺陷的回归锚点）', () => {
    const so = loadMap().find((e) => e['type_key'] === 'sales.order');
    expect(so?.['primary_key']).toEqual(['doc_type_no', 'doc_no']);
    expect(so?.['operation_extra_keys']).toEqual({
      approve: ['docdate', 'approvedate'],
      disapprove: ['docdate', 'approvedate'],
    });
  });
});