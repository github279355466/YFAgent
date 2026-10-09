/**
 * 工具定义单元测试。
 *
 * 验证各工具的 inputSchema 结构、handler 基本行为。
 * 不依赖真实 ERP 连接（mock context）。
 */

import { describe, it, expect } from 'vitest';
import { manifestTool } from '../src/tools/manifest.js';
import { queryTool } from '../src/tools/query.js';
import { readTool } from '../src/tools/read.js';
import { helpTool } from '../src/tools/help.js';
import { registerAllTools, EXPECTED_TOOLS } from '../src/tools/index.js';
import { ToolRegistry } from '../src/registry.js';
import type { ToolContext } from '../src/session.js';

// Mock ToolContext（不调真实 ERP）
const mockContext: ToolContext = {
  token: 'test-token-12345678',
  client: null as unknown as ToolContext['client'],
  catalog: null as unknown as ToolContext['catalog'],
};

describe('工具定义完整性', () => {
  const tools = [manifestTool, queryTool, readTool, helpTool];

  for (const tool of tools) {
    describe(tool.name, () => {
      it('name 非空', () => {
        expect(tool.name).toBeTruthy();
      });

      it('description 非空', () => {
        expect(tool.description).toBeTruthy();
        expect(tool.description.length).toBeGreaterThan(10);
      });

      it('inputSchema.type 为 object', () => {
        expect(tool.inputSchema.type).toBe('object');
      });

      it('handler 是函数', () => {
        expect(typeof tool.handler).toBe('function');
      });
    });
  }
});

describe('registerAllTools + EXPECTED_TOOLS 门禁', () => {
  it('注册的工具数量与 EXPECTED_TOOLS 一致', () => {
    const registry = new ToolRegistry();
    registerAllTools(registry);

    expect(registry.size).toBe(EXPECTED_TOOLS.length);
  });

  it('门禁断言通过', () => {
    const registry = new ToolRegistry();
    registerAllTools(registry);

    expect(() => registry.assertAllRegistered([...EXPECTED_TOOLS])).not.toThrow();
  });

  it('每个期望的工具都能 get 到', () => {
    const registry = new ToolRegistry();
    registerAllTools(registry);

    for (const name of EXPECTED_TOOLS) {
      expect(registry.get(name)).toBeDefined();
    }
  });
});

describe('query handler 参数校验', () => {
  it('缺少 type_key 返回 error', async () => {
    const result = await queryTool.handler({}, mockContext);
    expect(result).toHaveProperty('error');
  });
});

describe('read handler 参数校验', () => {
  it('缺少 type_key 返回 error', async () => {
    const result = await readTool.handler({ datakeys: [] }, mockContext);
    expect(result).toHaveProperty('error');
  });

  it('缺少 datakeys 返回 error', async () => {
    const result = await readTool.handler({ type_key: 'supplier' }, mockContext);
    expect(result).toHaveProperty('error');
  });

  it('datakeys 为空数组返回 error', async () => {
    const result = await readTool.handler(
      { type_key: 'supplier', datakeys: [] },
      mockContext,
    );
    expect(result).toHaveProperty('error');
  });
});

describe('help handler 参数校验', () => {
  it('缺少 type_key 返回 error', async () => {
    const result = await helpTool.handler({}, mockContext);
    expect(result).toHaveProperty('error');
  });
});
