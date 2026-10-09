import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkErpConnectivity } from '../src/health-check.js';

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // 每个测试前重置 mock
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetchOk(latencyMs = 50): void {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
    await new Promise((r) => setTimeout(r, latencyMs));
    return { ok: true, status: 200, statusText: 'OK' };
  });
}

function mockFetchError(status: number, statusText: string): void {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: false,
    status,
    statusText,
  });
}

function mockFetchNetworkError(message = 'ECONNREFUSED'): void {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(message));
}

function mockFetchTimeout(): void {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    (_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        // 模拟永不响应，等 AbortController 超时
        const onAbort = () => {
          const err = new DOMException('The operation was aborted.', 'AbortError');
          reject(err);
        };
        init?.signal?.addEventListener('abort', onAbort);
      }),
  );
}

// ---------------------------------------------------------------------------
// 测试用例
// ---------------------------------------------------------------------------

describe('checkErpConnectivity', () => {
  it('连通成功返回 ok=true', async () => {
    mockFetchOk(20);
    const result = await checkErpConnectivity('http://erp.local', '50', 'tok', 5000);
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it('HTTP 非 200 返回 ok=false + 错误信息', async () => {
    mockFetchError(500, 'Internal Server Error');
    const result = await checkErpConnectivity('http://erp.local', '50', 'tok', 5000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('500');
  });

  it('网络错误返回 ok=false', async () => {
    mockFetchNetworkError('ECONNREFUSED');
    const result = await checkErpConnectivity('http://erp.local', '50', 'tok', 5000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });

  it('超时返回 ok=false + 超时信息', async () => {
    mockFetchTimeout();
    const timeoutMs = 200;
    const result = await checkErpConnectivity('http://erp.local', '50', 'tok', timeoutMs);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('超时');
    expect(result.latencyMs).toBe(timeoutMs);
  }, 5000);

  it('发送正确的请求头和路径', async () => {
    mockFetchOk();
    await checkErpConnectivity('http://erp.local/', '50', 'my-token', 5000);

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = callArgs[0] as string;
    const options = callArgs[1] as RequestInit;

    // URL 拼接正确（去尾斜杠 + 固定路径）
    expect(url).toBe('http://erp.local/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost');

    // 四个必填头
    const headers = options.headers as Record<string, string>;
    expect(headers['digi-user-token']).toBe('my-token');
    expect(JSON.parse(headers['digi-datakey'])).toEqual({ CompanyId: '50' });
    expect(headers['Content-Type']).toContain('application/json');
  });

  it('baseUrl 尾部多斜杠正确处理', async () => {
    mockFetchOk();
    await checkErpConnectivity('http://erp.local///', '50', 'tok', 5000);

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('http://erp.local/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost');
  });

  it('latencyMs 反映实际耗时', async () => {
    mockFetchOk(100);
    const result = await checkErpConnectivity('http://erp.local', '50', 'tok', 5000);
    // 允许一定误差
    expect(result.latencyMs).toBeGreaterThanOrEqual(80);
    expect(result.latencyMs).toBeLessThan(500);
  });
});
