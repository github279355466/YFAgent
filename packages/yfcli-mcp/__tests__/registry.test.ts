/**
 * ToolRegistry 单元测试。
 */

import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../src/registry.js';
import type { ToolDefinition } from '../src/registry.js';

function makeTool(name: string): ToolDefinition {
  return {
    name,
    description: `Test tool ${name}`,
    inputSchema: { type: 'object', properties: {} },
    handler: async () => ({ ok: true }),
  };
}

describe('ToolRegistry', () => {
  it('register + get 返回已注册的工具', () => {
    const registry = new ToolRegistry();
    const tool = makeTool('test_tool');
    registry.register(tool);

    expect(registry.get('test_tool')).toBe(tool);
  });

  it('get 未注册的工具返回 undefined', () => {
    const registry = new ToolRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('list 返回全部已注册工具', () => {
    const registry = new ToolRegistry();
    registry.register(makeTool('a'));
    registry.register(makeTool('b'));
    registry.register(makeTool('c'));

    const list = registry.list();
    expect(list).toHaveLength(3);
    expect(list.map((t) => t.name).sort()).toEqual(['a', 'b', 'c']);
  });

  it('size 反映注册数量', () => {
    const registry = new ToolRegistry();
    expect(registry.size).toBe(0);
    registry.register(makeTool('x'));
    expect(registry.size).toBe(1);
  });

  it('重复注册同名工具抛错', () => {
    const registry = new ToolRegistry();
    registry.register(makeTool('dup'));

    expect(() => registry.register(makeTool('dup'))).toThrow(/已注册/);
  });

  describe('assertAllRegistered', () => {
    it('全部匹配时不抛错', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('a'));
      registry.register(makeTool('b'));

      expect(() => registry.assertAllRegistered(['a', 'b'])).not.toThrow();
    });

    it('缺少工具时抛错并列出缺失项', () => {
      const registry = new ToolRegistry();
      registry.register(makeTool('a'));

      expect(() => registry.assertAllRegistered(['a', 'b', 'c'])).toThrow(/缺少 2 个工具/);
      expect(() => registry.assertAllRegistered(['a', 'b', 'c'])).toThrow(/b, c/);
    });

    it('空期望列表不抛错', () => {
      const registry = new ToolRegistry();
      expect(() => registry.assertAllRegistered([])).not.toThrow();
    });
  });
});
