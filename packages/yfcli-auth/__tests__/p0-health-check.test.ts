/**
 * P0 回归测试（TDD 立红）—— 源码审查 2026-10-09
 *
 * ℹ️ 回归护栏：本文件记录的缺陷**已修复**，用例现已全部转绿。
 *    保留目的：防止回归。
 *    对应报告：docs/reviews/2026-10-09-代码审查报告.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkErpConnectivity } from '../src/health-check.js';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** 构造 ERP 返回的业务响应体 */
function erpBody(code: string, description: string): string {
  return JSON.stringify({
    std_data: {
      execution: { code, sql_code: '', description },
      parameter: { result: { rows: [] } },
    },
  });
}

/** 返回 HTTP 200 + 指定业务 code */
function mockFetchBody(code: string, description: string): void {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => erpBody(code, description),
    json: async () => JSON.parse(erpBody(code, description)),
  });
}

describe('[P0-7] health-check 以 HTTP 200 为唯一判据，业务失败被误报为连通', () => {
  it('HTTP 200 但 execution.code=-1（业务失败）时 ok 必须为 false', async () => {
    mockFetchBody('-1', '无效的身份令牌，请联系管理员分配身份令牌！');
    const result = await checkErpConnectivity('http://erp', 'TEST_COMPANY', 'badtoken', 5000);
    expect(result.ok).toBe(false);
  });

  it('HTTP 200 + code=-1 时错误信息应包含服务端 description', async () => {
    mockFetchBody('-1', 'digi-datakey is not valid.');
    const result = await checkErpConnectivity('http://erp', 'TEST_COMPANY', 'badtoken', 5000);
    expect(result.error ?? '').toContain('digi-datakey is not valid.');
  });

  it('HTTP 200 + code=0（真正连通）时 ok 应为 true', async () => {
    mockFetchBody('0', '查詢成功');
    const result = await checkErpConnectivity('http://erp', 'TEST_COMPANY', 'goodtoken', 5000);
    expect(result.ok).toBe(true);
  });
});

describe('[P0-8] health-check 在无 token 时以空串发请求', () => {
  it('空 token 应短路返回明确错误，且不得发出网络请求', async () => {
    const spy = globalThis.fetch as ReturnType<typeof vi.fn>;
    const result = await checkErpConnectivity('http://erp', 'TEST_COMPANY', '', 5000);
    expect(result.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
