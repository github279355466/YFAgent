/**
 * yf_analysis_prompt —— 获取助手 prompt 分片。
 *
 * 按 assistant_id × kind 二维寻址下发 prompt 分片。
 * 数据从 _routes.yaml 加载，prompt 内容从 knowledge/official/ai-assistants/ 读取。
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import { loadRoutes, getRoutes, type AssistantRoute } from './route-loader.js';

interface AnalysisPromptParams {
  assistant_id?: string;
  kind?: string;
  analysis_type?: string;
  version?: string;
  list?: boolean;
}

/** kind → 文件名映射 */
const KIND_FILE_MAP: Record<string, string> = {
  workflow: '_workflow.md',
  spec: '_spec.md',
};

/** 解析 knowledge/official/ai-assistants/ 基础路径 */
function resolveAssistantsBase(): string | null {
  const candidates = [
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'knowledge', 'official', 'ai-assistants'),
    resolve(process.cwd(), 'knowledge', 'official', 'ai-assistants'),
  ];
  for (const p of candidates) {
    try {
      readdirSync(p);
      return p;
    } catch { /* try next */ }
  }
  return null;
}

/** 根据 assistant_id 查找对应目录 */
function findAssistantDir(base: string, assistantId: string): string | null {
  try {
    const entries = readdirSync(base);
    // 匹配以 assistant_id 开头的目录（如 "02-item-check-duplicate-agent"）
    const prefix = assistantId.padStart(2, '0');
    const match = entries.find((e) => e.startsWith(prefix));
    if (match) return resolve(base, match);
  } catch { /* ignore */ }
  return null;
}

async function handleAnalysisPrompt(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisPromptParams;

  // 确保路由表已加载
  const routes = getRoutes().length > 0 ? getRoutes() : await loadRoutes();

  if (typed.list) {
    return {
      assistants: routes.map((a) => ({
        id: a.id,
        name: a.name,
        keywords: a.keywords,
        kinds: ['workflow', 'spec'],
        status: a.status,
      })),
      hint: '传入 assistant_id + kind(workflow|spec) 获取完整文档',
    };
  }

  if (!typed.assistant_id || !typed.kind) {
    return {
      hint: '需要同时传入 assistant_id 和 kind(workflow|spec)。使用 list:true 查看所有助手。',
    };
  }

  const assistant = routes.find((a) => a.id === typed.assistant_id || a.id.startsWith(typed.assistant_id! + '-'));
  if (!assistant) {
    return {
      error: `Unknown assistant_id: '${typed.assistant_id}'`,
      hint: 'Use list:true to see all available assistants',
    };
  }

  const fileName = KIND_FILE_MAP[typed.kind];
  if (!fileName) {
    return {
      error: `Kind '${typed.kind}' not supported`,
      available_kinds: Object.keys(KIND_FILE_MAP),
    };
  }

  // 从本地文件系统读取 prompt 内容
  const basePath = resolveAssistantsBase();
  if (!basePath) {
    return {
      error: 'prompt not found',
      hint: 'knowledge/official/ai-assistants/ directory not accessible',
    };
  }

  const assistantDir = findAssistantDir(basePath, typed.assistant_id);
  if (!assistantDir) {
    return {
      error: 'prompt not found',
      hint: `No directory found for assistant_id '${typed.assistant_id}' under ${basePath}`,
    };
  }

  const filePath = resolve(assistantDir, fileName);
  try {
    const content = readFileSync(filePath, 'utf8');
    return {
      assistant_id: typed.assistant_id,
      name: assistant.name,
      kind: typed.kind,
      version: typed.version ?? '1.0.0',
      cached: false,
      content,
    };
  } catch {
    return {
      error: 'prompt not found',
      hint: `File not found: ${filePath}`,
    };
  }
}

export const analysisPromptTool: ToolDefinition = {
  name: 'yf_analysis_prompt',
  description:
    '获取助手完整 prompt（从本地文件读取）。\n' +
    '支持 31 个 YF 助手，kind 为 workflow 或 spec。\n' +
    'Shards are independently usable.',
  inputSchema: {
    type: 'object',
    properties: {
      assistant_id: {
        type: 'string',
        description: 'assistant id, e.g. 02-item-check-duplicate',
      },
      kind: {
        type: 'string',
        description: 'prompt kind: workflow / spec',
      },
      analysis_type: {
        type: 'string',
        description: 'analysis type hint',
      },
      version: {
        type: 'string',
        description: 'client cached prompt version (for negotiation)',
      },
      list: {
        type: 'boolean',
        description: 'list all assistants and their available kinds',
      },
    },
  },
  handler: handleAnalysisPrompt,
};
