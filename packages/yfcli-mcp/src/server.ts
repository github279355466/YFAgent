/**
 * MCP HTTP/SSE Server —— 基于 Node.js 原生 http 模块。
 *
 * 端点：
 *   POST /mcp       — JSON-RPC 请求处理（Streamable HTTP）
 *   GET  /mcp/sse   — SSE 连接（需 Accept: text/event-stream）
 *   GET  /health     — 健康检查（公开端点，不需要 token）
 *
 * P3 鉴权全链路：
 * - 启动时调用 createAuth(config) 初始化 AuthProvider
 * - 每个请求从 Bearer header 提取 token → TokenManager 验证
 * - token 无效/过期 → 401 + 结构化错误（不泄露 token 内容）
 * - 健康检查调用 auth.checkHealth() 检测 ERP 连通性
 *
 * 会话管理：每个 initialize 创建新会话，30 分钟过期自动清理。
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

import { ToolRegistry } from './registry.js';
import { registerAllTools, EXPECTED_TOOLS } from './tools/index.js';
import {
  loadCatalog,
  createToolContext,
  SESSION_TTL_MS,
  SESSION_CLEANUP_INTERVAL_MS,
} from './session.js';
import type { ToolContext } from './session.js';
import type { TypeKeyCatalog } from 'yfcli-sdk';
import {
  createAuth,
  TokenExpiredError,
  TokenInvalidError,
  CredentialViolationError,
} from 'yfcli-auth';
import { maskToken } from 'yfcli-sdk';
import type { AuthProvider, AuthConfig, HealthCheckResult } from 'yfcli-auth';

// ------------------------------------------------------------------ 类型

interface HttpSession {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  createdAt: number;
  tokenHash: string;
  lastUsedAt: number;
  requestCount: number;
}

// ------------------------------------------------------------------ 工具函数

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

function extractToken(req: IncomingMessage): string | undefined {
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, mcp-session-id, x-request-id',
  );
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
}

/**
 * 通过 AuthProvider 验证 token。
 *
 * 返回 { valid: true } 或 { valid: false, error, statusCode }。
 * 错误信息不包含 token 值本身。
 */
function verifyTokenViaAuth(
  auth: AuthProvider,
  token: string,
): { valid: boolean; error?: string; statusCode?: number } {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'Missing authorization token', statusCode: 401 };
  }
  if (token.length < 8) {
    return { valid: false, error: 'Token too short', statusCode: 401 };
  }

  try {
    // 设置到 TokenManager 并立即读取以触发过期检查
    auth.setToken(token);
    auth.getToken(); // 若过期会抛 TokenExpiredError
    return { valid: true };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { valid: false, error: 'Token expired', statusCode: 401 };
    }
    if (err instanceof TokenInvalidError) {
      return { valid: false, error: 'Token invalid', statusCode: 401 };
    }
    return { valid: false, error: 'Token validation failed', statusCode: 401 };
  }
}

// ------------------------------------------------------------------ MCP Server 工厂

/**
 * 为单个会话创建 McpServer 实例。
 *
 * 每个会话有独立的 token → 独立的 ToolContext。
 * 工具从全局 registry 读取定义，但 handler 执行时使用会话级 context。
 */
function createMcpServer(
  registry: ToolRegistry,
  toolContext: ToolContext,
): McpServer {
  const server = new McpServer({
    name: 'yfcli-mcp',
    version: '0.1.0',
  });

  // 将 registry 中的工具逐个注册到 McpServer
  // MCP SDK server.tool() 第三个参数需要 ZodRawShape（Zod 类型对象）
  // 将 JSON Schema properties 转换为 Zod schema，具体校验由 handler 内部负责
  for (const tool of registry.list()) {
    const jsonProps = tool.inputSchema.properties ?? {};
    const zodShape: Record<string, z.ZodTypeAny> = {};
    for (const key of Object.keys(jsonProps)) {
      zodShape[key] = z.any().optional();
    }
    server.tool(
      tool.name,
      tool.description,
      zodShape,
      async (params) => {
        const result = await tool.handler(params as Record<string, unknown>, toolContext);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  return server;
}

// ------------------------------------------------------------------ HTTP 处理

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  sessions: Map<string, HttpSession>,
  registry: ToolRegistry,
  catalog: TypeKeyCatalog,
  auth: AuthProvider,
): Promise<void> {
  setCorsHeaders(res);

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // ---- /health（公开端点，不需要 token）----
  if (url.pathname === '/health' && req.method === 'GET') {
    let healthResult: HealthCheckResult | undefined;
    let erpStatus: 'reachable' | 'unreachable' | 'unknown' = 'unknown';

    try {
      healthResult = await auth.checkHealth();
      erpStatus = healthResult.ok ? 'reachable' : 'unreachable';
    } catch {
      erpStatus = 'unknown';
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'yfcli-mcp',
      version: '0.1.0',
      auth: 'configured',
      erp: erpStatus,
      sessions: sessions.size,
      tools: registry.size,
      ...(healthResult ? { latencyMs: healthResult.latencyMs } : {}),
      ...(healthResult?.error ? { erpError: healthResult.error } : {}),
    }));
    return;
  }

  // ---- /mcp/sse (GET) ----
  if (url.pathname === '/mcp/sse' && req.method === 'GET') {
    const accept = req.headers['accept'] ?? '';
    if (!accept.includes('text/event-stream')) {
      res.writeHead(406, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not Acceptable',
        message: 'Accept header must include text/event-stream',
      }));
      return;
    }

    // SSE 端点需要 token
    const token = extractToken(req) ?? '';
    const validation = verifyTokenViaAuth(auth, token);
    if (!validation.valid) {
      res.writeHead(validation.statusCode ?? 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Unauthorized',
        message: validation.error,
      }));
      return;
    }

    const tokenHash = hashToken(token);
    const toolContext = createToolContext(token, catalog, auth);
    const sessionId = randomUUID();
    const mcpServer = createMcpServer(registry, toolContext);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    await mcpServer.connect(transport);
    sessions.set(sessionId, {
      transport,
      server: mcpServer,
      createdAt: Date.now(),
      tokenHash,
      lastUsedAt: Date.now(),
      requestCount: 0,
    });

    console.error(`[yfcli-mcp] session created: ${sessionId.slice(0, 8)}... (token: ${maskToken(token)})`);
    await transport.handleRequest(req, res);
    return;
  }

  // ---- /mcp (POST) ----
  if (url.pathname === '/mcp' && req.method === 'POST') {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      res.writeHead(415, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unsupported Media Type' }));
      return;
    }

    // 读取 body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const bodyText = Buffer.concat(chunks).toString('utf-8');

    let body: Record<string, unknown> | undefined;
    try {
      body = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      }));
      return;
    }

    const sessionIdHeader = req.headers['mcp-session-id'] as string | undefined;

    // 首次请求（initialize）→ 创建会话
    if (!sessionIdHeader) {
      const token = extractToken(req) ?? '';
      const validation = verifyTokenViaAuth(auth, token);
      if (!validation.valid) {
        res.writeHead(validation.statusCode ?? 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32000, message: `Auth failed: ${validation.error}` },
          id: body?.id,
        }));
        return;
      }

      const tokenHash = hashToken(token);
      const toolContext = createToolContext(token, catalog, auth);
      const sessionId = randomUUID();
      const mcpServer = createMcpServer(registry, toolContext);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      await mcpServer.connect(transport);
      sessions.set(sessionId, {
        transport,
        server: mcpServer,
        createdAt: Date.now(),
        tokenHash,
        lastUsedAt: Date.now(),
        requestCount: 0,
      });

      console.error(`[yfcli-mcp] session created: ${sessionId.slice(0, 8)}...`);
      await transport.handleRequest(req, res, body);
      return;
    }

    // 后续请求 → 通过 session ID 查找
    if (sessionIdHeader && sessions.has(sessionIdHeader)) {
      const session = sessions.get(sessionIdHeader)!;
      session.lastUsedAt = Date.now();
      session.requestCount++;
      await session.transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Missing mcp-session-id header. Call initialize first.' },
      id: body?.id,
    }));
    return;
  }

  // ---- /mcp (GET with session) ----
  if (url.pathname === '/mcp' && req.method === 'GET') {
    const sessionIdHeader = req.headers['mcp-session-id'] as string | undefined;
    if (sessionIdHeader && sessions.has(sessionIdHeader)) {
      const session = sessions.get(sessionIdHeader)!;
      await session.transport.handleRequest(req, res);
      return;
    }
  }

  // ---- /mcp (DELETE) ----
  if (url.pathname === '/mcp' && req.method === 'DELETE') {
    const sessionIdHeader = req.headers['mcp-session-id'] as string | undefined;
    if (sessionIdHeader && sessions.has(sessionIdHeader)) {
      const session = sessions.get(sessionIdHeader)!;
      await session.transport.handleRequest(req, res);
      sessions.delete(sessionIdHeader);
      console.error(`[yfcli-mcp] session closed: ${sessionIdHeader.slice(0, 8)}...`);
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ------------------------------------------------------------------ Auth 配置构建

/**
 * 从环境变量构建 AuthConfig。
 *
 * 必填环境变量：
 * - YF_BASE_URL: ERP 基础 URL
 * - YF_COMPANY_ID: 公司别编号
 * - YFCLI_ERP_TOKEN: Token 值（或其环境变量名）
 */
function buildAuthConfig(): AuthConfig {
  const baseUrl = (process.env['YF_BASE_URL'] ?? '').replace(/\/+$/, '');
  const companyId = process.env['YF_COMPANY_ID'] ?? '';
  const tokenEnvVar = process.env['YF_TOKEN_ENV_VAR'] ?? 'YFCLI_ERP_TOKEN';

  return {
    baseUrl,
    companyId,
    tokenEnvVar,
    timeoutMs: parseInt(process.env['YF_TIMEOUT_MS'] ?? '30000', 10),
    limits: {
      maxRequestsPerMinute: parseInt(process.env['YF_MAX_RPM'] ?? '60', 10),
      maxBatchSize: parseInt(process.env['YF_MAX_BATCH'] ?? '100', 10),
    },
    allowedTemplates: ['query', 'read', 'create', 'update', 'delete'],
  };
}

// ------------------------------------------------------------------ 启动

export interface StartServerOptions {
  port?: number;
  /** 注入 AuthProvider（测试用）。默认从环境变量创建。 */
  auth?: AuthProvider;
  /** 跳过凭据红线校验（测试用）。 */
  skipCredentialCheck?: boolean;
}

/**
 * 启动 MCP HTTP/SSE 服务器。
 *
 * 1. 构建 AuthConfig → createAuth() 初始化 AuthProvider
 * 2. 凭据红线校验（失败即终止启动）
 * 3. 加载 TypeKeyCatalog（只读，全局共享）
 * 4. 创建 ToolRegistry + 注册全部工具
 * 5. 门禁断言无遗漏
 * 6. 启动 HTTP 服务器
 */
export async function startServer(options?: StartServerOptions): Promise<void> {
  const port = options?.port ?? parseInt(process.env['YF_MCP_PORT'] ?? '4001', 10);

  // 1. 初始化 AuthProvider
  console.error('[yfcli-mcp] Initializing auth provider...');
  const auth = options?.auth ?? createAuth(buildAuthConfig());

  // 2. 凭据红线校验
  if (!options?.skipCredentialCheck) {
    try {
      auth.validateCredentials();
      console.error('[yfcli-mcp] Credential policy validated.');
    } catch (err) {
      if (err instanceof CredentialViolationError) {
        console.error(`[yfcli-mcp] FATAL: ${err.message}`);
        throw err;
      }
      throw err;
    }
  }

  // 3. 加载 catalog
  console.error('[yfcli-mcp] Loading TypeKeyCatalog...');
  const catalog = await loadCatalog();

  // 4. 创建 registry + 注册工具
  const registry = new ToolRegistry();
  registerAllTools(registry);

  // 5. 门禁
  registry.assertAllRegistered([...EXPECTED_TOOLS]);
  console.error(`[yfcli-mcp] ${registry.size} tools registered, gate passed.`);

  // 6. 会话容器
  const sessions = new Map<string, HttpSession>();

  // 定期清理过期会话
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        sessions.delete(id);
        console.error(`[yfcli-mcp] session expired: ${id.slice(0, 8)}...`);
      }
    }
  }, SESSION_CLEANUP_INTERVAL_MS);

  // 7. 创建 HTTP 服务器
  const httpServer = createServer((req, res) => {
    handleRequest(req, res, sessions, registry, catalog, auth).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[yfcli-mcp] error: ${message}`);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  // 优雅关闭
  const shutdown = async () => {
    clearInterval(cleanupInterval);
    for (const [id, session] of sessions) {
      try {
        await session.transport.close();
      } catch {
        // ignore
      }
      sessions.delete(id);
    }
    httpServer.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      console.error(`[yfcli-mcp] HTTP server listening on http://0.0.0.0:${port}/mcp`);
      resolve();
    });
  });
}
