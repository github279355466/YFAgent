/**
 * yf_analysis_spec —— 获取分析方法论（Know-how）。
 *
 * section: core/intent/metric/dimension/operators/decision/stop/output
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AnalysisSpecParams {
  section?: string;
  version?: string;
  list?: boolean;
}

const SPEC_SECTIONS = [
  { id: 'core', description: '核心原则与内容框架' },
  { id: 'intent', description: '意图识别与路由规则' },
  { id: 'metric', description: '指标定义与计算口径' },
  { id: 'dimension', description: '维度拆解与下钻策略' },
  { id: 'operators', description: '分析算子（COMPARE/CONTRIBUTION/DRILL_DOWN）' },
  { id: 'decision', description: '决策门禁与停止判定' },
  { id: 'stop', description: '停止条件与收敛判据' },
  { id: 'output', description: '输出格式与呈现规范' },
];

async function handleAnalysisSpec(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisSpecParams;

  if (typed.list || !typed.section) {
    return {
      server_version: '1.0.0',
      sections: SPEC_SECTIONS,
      hint: "传入 section + version 获取正文（版本一致返回 cached=true 不重传）",
    };
  }

  const sectionInfo = SPEC_SECTIONS.find((s) => s.id === typed.section);
  if (!sectionInfo) {
    return {
      error: `Unknown section: '${typed.section}'`,
      available_sections: SPEC_SECTIONS.map((s) => s.id),
    };
  }

  // MVP：返回占位符，后续接入实际 spec 内容
  return {
    section: typed.section,
    version: typed.version ?? '1.0.0',
    cached: false,
    content: `[${sectionInfo.description}] spec content — 待接入实际内容`,
  };
}

export const analysisSpecTool: ToolDefinition = {
  name: 'yf_analysis_spec',
  description:
    'Fetch the analysis methodology (Know-how) by section, with version negotiation.\n' +
    'Use when the LLM needs the Analysis Rules framework to build a plan.\n' +
    '{ list: true } -> all section ids + usage',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description: 'spec section id: core/intent/metric/dimension/operators/decision/stop/output',
      },
      version: {
        type: 'string',
        description: "client's cached spec version (for negotiation)",
      },
      list: {
        type: 'boolean',
        description: 'list all sections instead of loading content',
      },
    },
  },
  handler: handleAnalysisSpec,
};
