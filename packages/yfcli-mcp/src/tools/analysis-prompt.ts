/**
 * yf_analysis_prompt —— 获取助手 prompt 分片。
 *
 * 按 assistant_id × kind 二维寻址下发 prompt 分片。
 * 易飞侧当前支持 22 个分析助手。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AnalysisPromptParams {
  assistant_id?: string;
  kind?: string;
  analysis_type?: string;
  version?: string;
  list?: boolean;
}

/** 易飞分析助手列表（与 AGENTS.md 中 22 个助手对齐） */
const ASSISTANTS = [
  { id: '01', name: '库存呆滞查询', kinds: ['extract', 'report'] },
  { id: '02', name: '供应商采购报告', kinds: ['extract', 'report'] },
  { id: '03', name: '客户销售报告', kinds: ['extract', 'report'] },
  { id: '04', name: '生产报告', kinds: ['extract', 'report'] },
  { id: '05', name: '采购业务异常查询', kinds: ['extract', 'report', 'attribution'] },
  { id: '06', name: '采购订单跟单', kinds: ['extract', 'report'] },
  { id: '07', name: '采购订单合规检查', kinds: ['extract', 'report'] },
  { id: '08', name: '采购订单摘要', kinds: ['extract', 'report'] },
  { id: '09', name: '工单呆滞查询', kinds: ['extract', 'report'] },
  { id: '10', name: '盘点分析报告', kinds: ['extract', 'report'] },
  { id: '11', name: '品号查重', kinds: ['extract', 'report'] },
  { id: '12', name: '生产进度延迟', kinds: ['extract', 'report'] },
  { id: '13', name: '销售订单跟单', kinds: ['extract', 'report'] },
  { id: '14', name: '销售订单合规检查', kinds: ['extract', 'report'] },
  { id: '15', name: '销售订单摘要', kinds: ['extract', 'report'] },
  { id: '16', name: '销售业务异常查询', kinds: ['extract', 'report', 'attribution'] },
  { id: '17', name: '会计凭证操作', kinds: ['extract', 'report'] },
  { id: '18', name: '科目余额查询', kinds: ['extract', 'report'] },
  { id: '19', name: '财务报表', kinds: ['extract', 'report'] },
  { id: '20', name: '应收账龄分析', kinds: ['extract', 'report', 'attribution'] },
  { id: '21', name: '应付账龄分析', kinds: ['extract', 'report', 'attribution'] },
  { id: '22', name: '成本分析', kinds: ['extract', 'report', 'attribution'] },
];

async function handleAnalysisPrompt(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisPromptParams;

  if (typed.list) {
    return {
      assistants: ASSISTANTS.map((a) => ({
        id: a.id,
        name: a.name,
        kinds: a.kinds,
      })),
      hint: "传入 assistant_id + kind 获取分片",
    };
  }

  if (!typed.assistant_id || !typed.kind) {
    return {
      hint: "需要同时传入 assistant_id 和 kind。使用 list:true 查看所有助手及其可用 kind。",
    };
  }

  const assistant = ASSISTANTS.find((a) => a.id === typed.assistant_id);
  if (!assistant) {
    return {
      error: `Unknown assistant_id: '${typed.assistant_id}'`,
      hint: 'Use list:true to see all available assistants',
    };
  }

  if (!assistant.kinds.includes(typed.kind!)) {
    return {
      error: `Kind '${typed.kind}' not available for assistant '${typed.assistant_id}'`,
      available_kinds: assistant.kinds,
    };
  }

  // MVP：返回占位符，后续接入实际 prompt 内容
  return {
    assistant_id: typed.assistant_id,
    kind: typed.kind,
    version: typed.version ?? '1.0.0',
    cached: false,
    content: `[${assistant.name}] ${typed.kind} prompt — 待接入实际内容`,
  };
}

export const analysisPromptTool: ToolDefinition = {
  name: 'yf_analysis_prompt',
  description:
    'Fetch an assistant prompt shard by assistant_id and kind.\n' +
    'Supports 22 YF assistants with varying kind sets.\n' +
    'Shards are independently usable.',
  inputSchema: {
    type: 'object',
    properties: {
      assistant_id: {
        type: 'string',
        description: 'assistant number: 01-22',
      },
      kind: {
        type: 'string',
        description: 'prompt kind: extract/report/attribution',
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
