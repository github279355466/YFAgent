/**
 * yf_expert_sales —— 销售专家引擎。
 *
 * action=parse_po: PO→订单底稿
 * action=quotation: 四象限报价
 * action=review: 订单评审
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertSalesParams {
  action: 'parse_po' | 'quotation' | 'review';
  data_json: string;
  params_json?: string;
}

async function handleExpertSales(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertSalesParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { parseStructuredPo, generateQuotation, reviewOrder } = await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'parse_po':
        // parseStructuredPo(params) — single object arg
        result = parseStructuredPo(data);
        break;
      case 'quotation':
        // generateQuotation(draftId, lines, params)
        result = generateQuotation(
          data.draft_id ?? data.draftId ?? '',
          data.lines ?? [],
          extraParams,
        );
        break;
      case 'review':
        // reviewOrder(reviewPackage, thresholds)
        result = reviewOrder(data, extraParams);
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

export const expertSalesTool: ToolDefinition = {
  name: 'yf_expert_sales',
  description:
    '销售专家引擎：PO解析 / 四象限报价 / 订单评审。\n' +
    'action=parse_po: PO→订单底稿。data={poNo, poDate, customerName, lines}\n' +
    'action=quotation: 四象限报价。data={draft_id, lines}\n' +
    'action=review: 订单评审。data=ReviewPackage',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['parse_po', 'quotation', 'review'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertSales,
};
