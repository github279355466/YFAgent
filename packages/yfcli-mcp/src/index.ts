/**
 * yfcli-mcp v0.1.0 — 易飞(E10) MCP Server
 *
 * 集中式工具注册表 + HTTP/SSE 传输 + Auth 全链路集成。
 *
 * 用法：
 *   import { startServer } from 'yfcli-mcp';
 *   await startServer({ port: 4001 });
 */

export { startServer } from './server.js';
export type { StartServerOptions } from './server.js';
export { ToolRegistry } from './registry.js';
export type { ToolDefinition, ToolInputSchema } from './registry.js';
export type { ToolContext } from './session.js';
export { registerAllTools, EXPECTED_TOOLS } from './tools/index.js';
