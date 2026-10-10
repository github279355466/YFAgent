/**
 * yf_expert_production —— 生产专家引擎。
 *
 * action=progress: 工单进度汇总
 * action=work_report: 报工统计
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertProductionParams {
  action: 'progress' | 'work_report';
  data_json: string;
  params_json?: string;
}

async function handleExpertProduction(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertProductionParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { summarizeProgress, summarizeWorkReports } = await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'progress':
        result = summarizeProgress(data, extraParams);
        break;
      case 'work_report':
        result = summarizeWorkReports(data);
        break;
      default:
        return { error: `Unknown action: '${typed.action}'` };
    }

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export const expertProductionTool: ToolDefinition = {
  name: 'yf_expert_production',
  description:
    '生产专家引擎：工单进度跟踪 / 报工统计。\n' +
    'action=progress: 工单进度汇总。data=WorkOrderProgress[]\n' +
    'action=work_report: 报工统计。data=WorkReportEntry[]',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['progress', 'work_report'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertProduction,
};
