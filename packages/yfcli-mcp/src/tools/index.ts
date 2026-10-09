/**
 * 工具注册入口 —— 将所有工具注册到 ToolRegistry。
 *
 * ★ 新增工具时只需：
 *   1. 在 tools/ 下创建新文件
 *   2. 在本文件中 import 并调用 registry.register()
 *   3. 在 EXPECTED_TOOLS 中添加名称
 *
 * assertAllRegistered() 会在启动时校验无遗漏。
 */

import type { ToolRegistry } from '../registry.js';
import { manifestTool } from './manifest.js';
import { queryTool } from './query.js';
import { readTool } from './read.js';
import { helpTool } from './help.js';

/** 期望注册的全部工具名（门禁清单）。 */
export const EXPECTED_TOOLS = [
  'yf_manifest',
  'yf_query',
  'yf_read',
  'yf_help',
] as const;

/** 将所有工具注册到 registry。 */
export function registerAllTools(registry: ToolRegistry): void {
  registry.register(manifestTool);
  registry.register(queryTool);
  registry.register(readTool);
  registry.register(helpTool);
}
