/**
 * yf_service_route —— AI 助手路由。
 *
 * 输入关键词列表 → 匹配助手 ID 和服务名。
 * 数据驱动：路由表从 _routes.yaml 加载（通过 route-loader）。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import { loadRoutes, getRoutes, type AssistantRoute } from './route-loader.js';

interface ServiceRouteParams {
  keywords: string[];
  exclude_keywords?: string[];
}

async function handleServiceRoute(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ServiceRouteParams;

  if (!typed.keywords || !Array.isArray(typed.keywords) || typed.keywords.length === 0) {
    return { error: "Missing or empty 'keywords' array" };
  }

  // 确保路由表已加载
  const routes = getRoutes().length > 0 ? getRoutes() : await loadRoutes();

  const excludeKeywords = typed.exclude_keywords ?? [];
  const candidates: AssistantRoute[] = [];

  for (const assistant of routes) {
    const excludedByInput = excludeKeywords.some((ek) => assistant.exclude.includes(ek));
    if (excludedByInput) continue;

    const matched = typed.keywords.some((kw) =>
      assistant.keywords.some((ak) => ak.includes(kw) || kw.includes(ak)),
    );
    if (matched) candidates.push(assistant);
  }

  if (candidates.length === 0) {
    return { matched: false };
  }

  const winner = candidates[0]!;
  return {
    matched: true,
    assistant_id: winner.id,
    name: winner.name,
    service: winner.service,
    status: winner.status,
  };
}

export const serviceRouteTool: ToolDefinition = {
  name: 'yf_service_route',
  description:
    '智能分析助手路由：输入关键词列表，匹配业务助手，返回匹配的助手 ID 和 ERP 服务名。',
  inputSchema: {
    type: 'object',
    properties: {
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '关键词列表',
      },
      exclude_keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '排除关键词列表',
      },
    },
    required: ['keywords'],
  },
  handler: handleServiceRoute,
};