/**
 * yf_expert_ar —— 应收会计专家引擎。
 *
 * action=aging: 账龄分析(32项指标)
 * action=dunning: 催收评分(4维)
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertArParams {
  action: 'aging' | 'dunning';
  data_json: string;
  params_json?: string;
}

async function handleExpertAr(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertArParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { calcAgingReport, calcCollectionScores } = await import('yfcli-experts');

    let result: unknown;
    if (typed.action === 'aging') {
      result = calcAgingReport(data, extraParams);
    } else {
      result = calcCollectionScores(data, extraParams);
    }

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export const expertArTool: ToolDefinition = {
  name: 'yf_expert_ar',
  description:
    '应收会计专家引擎：账龄分析(32项指标) / 催收评分(4维)。\n' +
    'action=aging: 输入应收明细数组，输出账龄分布、逾期分析、DSO、坏账拨备。\n' +
    'action=dunning: 输入催收评分输入数组，输出4维评分、关注等级、建议动作。\n' +
    '所有数值由确定性引擎计算。数据需先通过 yf_run 从ERP获取后传入。',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['aging', 'dunning'], description: 'aging=账龄分析, dunning=催收评分' },
      data_json: { type: 'string', description: '输入数据 JSON 数组' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertAr,
};
