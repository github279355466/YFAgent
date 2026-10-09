/**
 * YfClient CRUD 五操作单元测试。
 *
 * 使用 mock transport，不需要真实网络。
 * 覆盖正常流程 + 9 条硬约束的反向用例。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YfClient, NOOP_LOGGER } from '../../src/client/yf-client.js';
import type { YfTransport } from '../../src/transport/http-transport.js';
import type { YfHttpResponse } from '../../src/transport/http-transport.js';
import type { ResolvedRuntimeConfig } from '../../src/types/config.js';
import type { YfServiceNameResolver, YfTypeKeyEntry } from '../../src/types/domain.js';
import type { YfRequestEnvelope } from '../../src/types/protocol.js';
import type { YfErrorContext } from '../../src/types/errors.js';
import { YfError } from '../../src/types/errors.js';
import type { YfQueryParameter } from '../../src/types/conditions.js';
import { allOf, field, pagination, queryParameter } from '../../src/conditions/builder.js';

// ------------------------------------------------------------------ Mock 工厂

function makeConfig(overrides?: Partial<ResolvedRuntimeConfig>): ResolvedRuntimeConfig {
  return {
    baseUrl: 'http://test-server/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost',
    endpoint: 'http://test-server/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost',
    companyId: '50',
    token: 'TEST_TOKEN_ABCDEF1234567890ABCDEF1234567890ABCDEF12345678',
    servicePrefix: 'yf.',
    timeoutMs: 30000,
    warnOnSilentError: true,
    ...overrides,
  };
}

interface MockCatalogEntry {
  readonly typeKey: string;
  readonly services: Record<string, string>;
  readonly primaryKey?: readonly string[];
}

function makeCatalog(entries: MockCatalogEntry[]): YfServiceNameResolver {
  const map = new Map<string, YfTypeKeyEntry>();
  for (const e of entries) {
    map.set(e.typeKey, {
      typeKey: e.typeKey,
      title: e.typeKey,
      services: e.services,
      primaryKey: e.primaryKey ?? [],
      detailNodes: [],
      unavailable: false,
    });
  }
  return {
    resolveServiceName(typeKey: string, operation: string): string {
      const entry = map.get(typeKey);
      if (entry === undefined) {
        throw new YfError({
          layer: 'business',
          kind: 'service_not_registered',
          message: `type_key "${typeKey}" 不在 knowledge/typekey/typekey_map.yaml 中。`,
        });
      }
      const serviceName = entry.services[operation];
      if (serviceName === undefined) {
        throw new YfError({
          layer: 'business',
          kind: 'service_not_registered',
          message: `type_key "${typeKey}" 无 ${operation} 服务。`,
        });
      }
      return serviceName;
    },
    findEntry(typeKey: string) {
      return map.get(typeKey);
    },
    listTypeKeys() {
      return [...map.keys()].sort();
    },
  };
}

/** 构造成功的查询响应体。 */
function queryResponse(rows: Record<string, unknown>[] = [], totalResult?: number) {
  return JSON.stringify({
    std_data: {
      execution: { code: '0', sql_code: '', description: '查詢成功' },
      parameter: {
        total_result: totalResult ?? rows.length,
        has_next: false,
        result: { cnt: rows.length, rows },
      },
    },
  });
}

/** 构造成功的主键类响应体。 */
function actionResponse(items: unknown[] = []) {
  return JSON.stringify({
    std_data: {
      execution: { code: '0', sql_code: '', description: '执行成功' },
      parameter: {
        result: { success: items, error: [] },
      },
    },
  });
}

/** 构造业务失败响应体。 */
function businessErrorResponse(message: string) {
  return JSON.stringify({
    std_data: {
      execution: { code: '-1', sql_code: '', description: message },
      parameter: {
        result: { success: [], error: [{ message, data: {} }] },
      },
    },
  });
}

function makeMockTransport(responseBody: string, status = 200): YfTransport {
  return {
    async post(): Promise<YfHttpResponse> {
      return {
        status,
        bodyText: responseBody,
        elapsedMs: 42,
        preview: responseBody.slice(0, 200),
      };
    },
  };
}

/** 捕获发送到 transport 的请求体。 */
function captureTransport(): { transport: YfTransport; captured: YfRequestEnvelope[] } {
  const captured: YfRequestEnvelope[] = [];
  const transport: YfTransport = {
    async post(_config, _serviceName, envelope): Promise<YfHttpResponse> {
      captured.push(envelope);
      return {
        status: 200,
        bodyText: queryResponse([]),
        elapsedMs: 10,
        preview: '',
      };
    },
  };
  return { transport, captured };
}

// ------------------------------------------------------------------ 测试套件

describe('YfClient.query', () => {
  it('正常 query 流程：返回 rows + totalResult + hasNext', async () => {
    const rows = [{ item_no: '001', item_name: '测试物料' }];
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(queryResponse(rows, 1)),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([field('item_no', '=', '001')]), page: pagination(1, 20) });
    const result = await client.query('item', param);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ item_no: '001', item_name: '测试物料' });
    expect(result.totalResult).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.count).toBe(1);
  });

  it('空结果 + warnOnSilentError=true 触发告警', async () => {
    const warnSpy = vi.fn();
    const client = new YfClient({
      config: makeConfig({ warnOnSilentError: true }),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(queryResponse([], 0)),
      logger: { ...NOOP_LOGGER, warn: warnSpy },
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([field('item_no', '=', '999')]), page: pagination(1, 20) });
    const result = await client.query('item', param);

    expect(result.rows).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('返回 0 行');
  });

  it('空结果 + warnOnSilentError=false 不告警', async () => {
    const warnSpy = vi.fn();
    const client = new YfClient({
      config: makeConfig({ warnOnSilentError: false }),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(queryResponse([], 0)),
      logger: { ...NOOP_LOGGER, warn: warnSpy },
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    await client.query('item', param);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('枚举传 "Y.已审核" → 自动修正为 "Y" 并告警', async () => {
    const warnSpy = vi.fn();
    const { transport, captured } = captureTransport();
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'voucher', services: { query: 'yf.oapi.voucher.query.get' } }]),
      transport,
      logger: { ...NOOP_LOGGER, warn: warnSpy },
      enumSpecs: { approve_status: { fieldName: 'approve_status', codedText: true } },
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([field('approve_status', '=', 'Y.已审核')]), page: pagination(1, 20) });
    await client.query('voucher', param);

    // 验证清洗后的值
    const sentParam = captured[0]!.std_data.parameter as YfQueryParameter;
    const sentField = sentParam.conditions.fields.find(
      (f) => 'field_name' in f && f.field_name === 'approve_status',
    ) as { field_name: string; value: string } | undefined;
    expect(sentField?.value).toBe('Y');

    // 验证告警（至少包含枚举清洗告警；空结果告警也可能触发）
    const enumWarnings = warnSpy.mock.calls.filter((c: unknown[]) => String(c[0]).includes('枚举清洗'));
    expect(enumWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('未知 type_key → 抛 YfError(service_not_registered)', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([]),
      transport: makeMockTransport(queryResponse()),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    await expect(client.query('nonexistent', param)).rejects.toThrow(YfError);
    await expect(client.query('nonexistent', param)).rejects.toThrow(/不在.*yaml/);
  });

  it('HTTP 500 + HTML → 不解析 body，抛 http 层错误', async () => {
    const htmlBody = '<html><body>Internal Server Error</body></html>';
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(htmlBody, 500),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    try {
      await client.query('item', param);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.layer).toBe('http');
      expect(yfErr.httpStatus).toBe(500);
    }
  });

  it('业务失败 code=-1 → 抛 business 层错误', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(businessErrorResponse('conditions not found.')),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    try {
      await client.query('item', param);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.layer).toBe('business');
      expect(yfErr.kind).toBe('conditions_invalid');
    }
  });
});

describe('YfClient.read', () => {
  it('正常 read 流程：返回 success items', async () => {
    const items = [{ doc_type_no: '091W', doc_no: '0001', status: 'Y' }];
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { read: 'yf.oapi.sales.order.read.get' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse(items)),
    });

    const result = await client.read('sales.order', {
      datakeys: [{ doc_type_no: '091W', doc_no: '0001' }],
    });

    expect(result.empty).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.serviceName).toBe('yf.oapi.sales.order.read.get');
  });

  it('主键全错 code=0 + 空数组 → 触发空结果告警', async () => {
    const warnSpy = vi.fn();
    const client = new YfClient({
      config: makeConfig({ warnOnSilentError: true }),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { read: 'yf.oapi.sales.order.read.get' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse([])),
      logger: { ...NOOP_LOGGER, warn: warnSpy },
    });

    const result = await client.read('sales.order', {
      datakeys: [{ doc_type_no: 'WRONG', doc_no: 'WRONG' }],
    });

    expect(result.empty).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('code=0 但数据为空');
  });

  it('datakeys 缺少主键字段 → 本地抛 primary_key_missing', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { read: 'yf.oapi.sales.order.read.get' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse([])),
    });

    await expect(
      client.read('sales.order', { datakeys: [{ doc_type_no: '091W' }] }),
    ).rejects.toThrow(/缺少主键字段.*doc_no/);
  });

  it('datakeys 为空 → 本地抛 empty_result', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { read: 'yf.oapi.sales.order.read.get' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse([])),
    });

    await expect(
      client.read('sales.order', { datakeys: [] }),
    ).rejects.toThrow(/datakeys 为空/);
  });
});

describe('YfClient.create', () => {
  it('正常 create 流程', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'customer',
        services: { create: 'yf.oapi.customer.data.create.post' },
      }]),
      transport: makeMockTransport(actionResponse([{ customer_code: 'C001' }])),
    });

    const result = await client.create('customer', {
      customer_basic_data_file_data: [
        { customer_code: 'C001', customer_name: '测试客户' },
      ],
    });

    expect(result.empty).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.serviceName).toBe('yf.oapi.customer.data.create.post');
  });

  it('create 发送正确的封包结构', async () => {
    const { transport, captured } = captureTransport();
    // Override transport to return action response
    const mockTransport: YfTransport = {
      async post(_config, _serviceName, envelope): Promise<YfHttpResponse> {
        captured.push(envelope);
        return {
          status: 200,
          bodyText: actionResponse([{ ok: true }]),
          elapsedMs: 10,
          preview: '',
        };
      },
    };

    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'customer',
        services: { create: 'yf.oapi.customer.data.create.post' },
      }]),
      transport: mockTransport,
    });

    const entityData = { customer_code: 'C001', customer_name: '测试' };
    await client.create('customer', {
      customer_basic_data_file_data: [entityData],
    });

    expect(captured).toHaveLength(1);
    const sentParam = captured[0]!.std_data.parameter as Record<string, unknown[]>;
    expect(sentParam['customer_basic_data_file_data']).toEqual([entityData]);
  });

  it('create 业务失败 → 抛 business 层错误', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'customer',
        services: { create: 'yf.oapi.customer.data.create.post' },
      }]),
      transport: makeMockTransport(businessErrorResponse('主键冲突')),
    });

    await expect(
      client.create('customer', {
        customer_basic_data_file_data: [{ customer_code: 'EXISTING' }],
      }),
    ).rejects.toThrow(YfError);
  });

  it('未知 type_key create → 抛 service_not_registered', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([]),
      transport: makeMockTransport(actionResponse()),
    });

    await expect(
      client.create('nonexistent', { data: [{}] }),
    ).rejects.toThrow(/不在.*yaml/);
  });
});

describe('YfClient.update', () => {
  it('正常 update 流程', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'customer',
        services: { update: 'yf.oapi.customer.data.update.post' },
      }]),
      transport: makeMockTransport(actionResponse([{ updated: true }])),
    });

    const result = await client.update('customer', {
      customer_basic_data_file_data: [
        { customer_code: 'C001', customer_name: '更新后名称' },
      ],
    });

    expect(result.empty).toBe(false);
    expect(result.serviceName).toBe('yf.oapi.customer.data.update.post');
  });

  it('update 业务失败 → 抛 business 层错误', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'customer',
        services: { update: 'yf.oapi.customer.data.update.post' },
      }]),
      transport: makeMockTransport(businessErrorResponse('找不到資料表:[XXX]')),
    });

    await expect(
      client.update('customer', {
        customer_basic_data_file_data: [{ customer_code: 'C001' }],
      }),
    ).rejects.toThrow(YfError);
  });
});

describe('YfClient.delete', () => {
  it('正常 delete 流程', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { delete: 'yf.oapi.sales.order.delete.post' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse([{ deleted: true }])),
    });

    const result = await client.delete('sales.order', {
      datakeys: [{ doc_type_no: '091W', doc_no: '0001' }],
    });

    expect(result.empty).toBe(false);
    expect(result.serviceName).toBe('yf.oapi.sales.order.delete.post');
  });

  it('delete 主键缺失 → 本地抛 primary_key_missing', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'sales.order',
        services: { delete: 'yf.oapi.sales.order.delete.post' },
        primaryKey: ['doc_type_no', 'doc_no'],
      }]),
      transport: makeMockTransport(actionResponse([])),
    });

    await expect(
      client.delete('sales.order', { datakeys: [{ doc_type_no: '091W' }] }),
    ).rejects.toThrow(/缺少主键字段/);
  });
});

describe('YfClient.action (通用主键操作)', () => {
  it('approve 走 action 通道', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{
        typeKey: 'voucher',
        services: { approve: 'yf.oapi.voucher.approve.post' },
        primaryKey: ['voucher_no'],
      }]),
      transport: makeMockTransport(actionResponse([{ approved: true }])),
    });

    const result = await client.action('voucher', 'approve', {
      datakeys: [{ voucher_no: 'V001' }],
    });

    expect(result.empty).toBe(false);
    expect(result.serviceName).toBe('yf.oapi.voucher.approve.post');
  });
});

describe('反向用例：易飞 9 条硬约束', () => {
  it('约束1: 枚举回参 "Y.已审核" 作为条件只认纯编码 "Y"', async () => {
    const warnSpy = vi.fn();
    const { transport, captured } = captureTransport();
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'voucher', services: { query: 'yf.oapi.voucher.query.get' } }]),
      transport,
      logger: { ...NOOP_LOGGER, warn: warnSpy },
      enumSpecs: { approve_status: { fieldName: 'approve_status', codedText: true } },
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([field('approve_status', '=', 'Y.已审核')]), page: pagination(1, 20) });
    await client.query('voucher', param);

    const sentParam = captured[0]!.std_data.parameter as YfQueryParameter;
    const sentField = sentParam.conditions.fields.find(
      (f) => 'field_name' in f && f.field_name === 'approve_status',
    ) as { value: string } | undefined;
    expect(sentField?.value).toBe('Y');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('约束2: 主键全错返回 code=0 + 空数组 → 必须告警', async () => {
    const warnSpy = vi.fn();
    const client = new YfClient({
      config: makeConfig({ warnOnSilentError: true }),
      catalog: makeCatalog([{
        typeKey: 'item',
        services: { read: 'yf.oapi.item.read.get' },
        primaryKey: ['item_no'],
      }]),
      transport: makeMockTransport(actionResponse([])),
      logger: { ...NOOP_LOGGER, warn: warnSpy },
    });

    const result = await client.read('item', { datakeys: [{ item_no: 'WRONG_KEY' }] });
    expect(result.empty).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('code=0 但数据为空');
  });

  it('约束5: 错误 token 返回 HTTP 500 + HTML → 不解析 body', async () => {
    const htmlError = '<!DOCTYPE html><html><head><title>500</title></head><body>Server Error</body></html>';
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(htmlError, 500),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    try {
      await client.query('item', param);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.layer).toBe('http');
      expect(yfErr.kind).toBe('token_invalid');
      expect(yfErr.httpStatus).toBe(500);
      // 确保没有尝试解析 HTML 为 JSON（否则会抛 protocol 层 malformed_response）
      expect(yfErr.message).not.toContain('不是合法 JSON');
    }
  });

  it('约束6: 错误 conditions 结构是显式报错 code=-1', async () => {
    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { query: 'yf.oapi.item.query.get' } }]),
      transport: makeMockTransport(businessErrorResponse('conditions not found.')),
    });

    const param: YfQueryParameter = queryParameter({ conditions: allOf([]), page: pagination(1, 20) });
    try {
      await client.query('item', param);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.layer).toBe('business');
      expect(yfErr.kind).toBe('conditions_invalid');
    }
  });

  it('error[] 双结构兼容：结构 A {message,data}', async () => {
    const responseA = JSON.stringify({
      std_data: {
        execution: { code: '-1', sql_code: '', description: '主键冲突' },
        parameter: {
          result: {
            success: [],
            error: [{ message: '主键冲突', data: { item_no: '001' } }],
          },
        },
      },
    });

    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { create: 'yf.oapi.item.create.post' } }]),
      transport: makeMockTransport(responseA),
    });

    try {
      await client.create('item', { item_data: [{ item_no: '001' }] });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.details).toHaveLength(1);
      expect(yfErr.details[0]!.message).toBe('主键冲突');
    }
  });

  it('error[] 双结构兼容：结构 B {information:[{message,data}]}', async () => {
    const responseB = JSON.stringify({
      std_data: {
        execution: { code: '-1', sql_code: '', description: '批量失败' },
        parameter: {
          result: {
            success: [],
            error: [{ information: [{ message: '第2行失败', data: { row: 2 } }] }],
          },
        },
      },
    });

    const client = new YfClient({
      config: makeConfig(),
      catalog: makeCatalog([{ typeKey: 'item', services: { create: 'yf.oapi.item.create.post' } }]),
      transport: makeMockTransport(responseB),
    });

    try {
      await client.create('item', { item_data: [{}, {}] });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(YfError);
      const yfErr = err as YfError;
      expect(yfErr.details).toHaveLength(1);
      expect(yfErr.details[0]!.message).toBe('第2行失败');
    }
  });
});




