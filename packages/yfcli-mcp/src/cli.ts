#!/usr/bin/env node
/**
 * yfcli-mcp CLI 入口 — 供 Servy / node 直接运行
 *
 * 用法:
 *   npx tsx packages/yfcli-mcp/src/cli.ts --http --port 4001
 *   node dist/cli.js --http --port 4001
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';

// 加载 .env 文件（从当前工作目录或项目根目录查找）
function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env'),
  ];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
      console.error(`[yfcli-mcp] Loaded env from ${envPath}`);
      return;
    }
  }
  console.error('[yfcli-mcp] No .env file found, using system environment variables only.');
}

loadEnv();

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
