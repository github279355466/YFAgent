/**
 * 集中式工具注册表 —— 所有 MCP 工具必须在此注册。
 *
 * 设计动机（YZCLI 反面教材）：
 * YZCLI 逐个显式调用 registerXxxTool()，新增工具时容易漏挂。
 * 本注册表提供 assertAllRegistered() 门禁，启动时校验无遗漏。
 */

import type { ToolContext } from './session.js';

/** MCP 工具的 JSON Schema 输入定义。 */
export interface ToolInputSchema {
  readonly type: 'object';
  readonly properties?: Record<string, unknown>;
  readonly required?: string[];
}

/** 一个完整的工具定义。 */
export interface ToolDefinition {
  /** 工具名（MCP tool name），如 yf_query / yf_read。 */
  readonly name: string;
  /** 工具描述（展示给 LLM）。 */
  readonly description: string;
  /** JSON Schema 输入参数定义。 */
  readonly inputSchema: ToolInputSchema;
  /** 执行函数。返回值会序列化为 MCP content。 */
  readonly handler: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

/**
 * 集中式工具注册表。
 *
 * 用法：
 * ```ts
 * const registry = new ToolRegistry();
 * registry.register(manifestTool);
 * registry.register(queryTool);
 * // 启动时门禁
 * registry.assertAllRegistered(['yf_manifest', 'yf_query', 'yf_read', 'yf_help']);
 * ```
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  /** 注册一个工具。同名覆盖会抛错（防止意外覆盖）。 */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`工具 "${tool.name}" 已注册，不允许重复注册`);
    }
    this.tools.set(tool.name, tool);
  }

  /** 按名称获取工具定义。 */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /** 返回全部已注册的工具列表。 */
  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  /** 已注册工具数量。 */
  get size(): number {
    return this.tools.size;
  }

  /**
   * 门禁断言：确保期望的工具全部已注册。
   *
   * 在 server 启动前调用。若有遗漏，立即抛错而非运行时才发现。
   * @param expected 期望已注册的工具名列表。
   */
  assertAllRegistered(expected: string[]): void {
    const missing = expected.filter((name) => !this.tools.has(name));
    if (missing.length > 0) {
      throw new Error(
        `工具注册不完整！缺少 ${missing.length} 个工具: ${missing.join(', ')}` +
        `\n已注册: [${[...this.tools.keys()].join(', ')}]`,
      );
    }
  }
}
