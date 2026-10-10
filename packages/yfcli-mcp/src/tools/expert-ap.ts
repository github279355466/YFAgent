/**
 * yf_expert_ap —— 应付会计专家引擎。
 *
 * action=analyze: 14维应付数据分析
 * action=priority: 付款优先级4维评分
 * action=match: 三单匹配差异检测
 * action=monthend: 月结5阶段编排
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertApParams {
  action: 'analyze' | 'priority' | 'match' | 'monthend';
  data_json: string;
  params_json?: string;
}

async function handleExpertAp(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertApParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { analyzeAp, calcPaymentPriority, performThreeWayMatch, planMonthEnd } =
      await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'analyze':
        result = analyzeAp(data, extraParams);
        break;
      case 'priority':
        result = calcPaymentPriority(data, extraParams);
        break;
      case 'match':
        result = performThreeWayMatch(data, extraParams);
        break;
      case 'monthend':
        result = planMonthEnd(data);
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

export const expertApTool: ToolDefinition = {
  name: 'yf_expert_ap',
  description:
    '应付会计专家引擎：14维分析 / 付款优先级 / 三单匹配 / 月结编排。\n' +
    'action=analyze: 14维应付数据分析。data=ApDetail[]\n' +
    'action=priority: 付款优先级4维评分。data=PaymentInput[]\n' +
    'action=match: 三单匹配差异检测。data=MatchGroup[]\n' +
    'action=monthend: 月结5阶段编排。data=MonthEndConfig',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['analyze', 'priority', 'match', 'monthend'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertAp,
};
