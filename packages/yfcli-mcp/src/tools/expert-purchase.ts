/**
 * yf_expert_purchase —— 采购专家引擎。
 *
 * action=inquiry: 多供应商比价
 * action=delivery: 交期评审
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertPurchaseParams {
  action: 'inquiry' | 'delivery';
  data_json: string;
  params_json?: string;
}

async function handleExpertPurchase(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertPurchaseParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { compareQuotes, reviewDelivery } = await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'inquiry':
        result = compareQuotes(data, extraParams);
        break;
      case 'delivery':
        result = reviewDelivery(data, extraParams);
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

export const expertPurchaseTool: ToolDefinition = {
  name: 'yf_expert_purchase',
  description:
    '采购专家引擎：询价比价 / 交期评审。\n' +
    'action=inquiry: 多供应商比价。data={items, quotes}\n' +
    'action=delivery: 交期评审。data=MaterialRequirement[]',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['inquiry', 'delivery'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertPurchase,
};
