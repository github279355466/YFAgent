import { describe, it, expect } from 'vitest';
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
