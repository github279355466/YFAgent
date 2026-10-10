#!/usr/bin/env node
/**
 * yfcli-mcp CLI 入口 — 供 Servy / node 直接运行
 *
 * 用法:
 *   npx tsx packages/yfcli-mcp/src/cli.ts --http --port 4001
 *   node dist/cli.js --http --port 4001
 */

import { startServer } from './server.js';

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const port = portIdx >= 0 ? parseInt(args[portIdx + 1]!, 10) : parseInt(process.env.YF_MCP_PORT || '4001', 10);
const http = args.includes('--http');

if (!http) {
  console.error('[yfcli-mcp] 当前仅支持 HTTP 模式，请添加 --http 参数');
  process.exit(1);
}

console.log(`[yfcli-mcp] Starting MCP Server on port ${port}...`);
startServer({ port }).catch((err) => {
  console.error('[yfcli-mcp] Fatal:', err);
  process.exit(1);
});
