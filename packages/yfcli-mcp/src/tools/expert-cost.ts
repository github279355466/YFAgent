/**
 * yf_expert_cost —— 成本会计专家引擎。
 *
 * action=simulate: BOM成本模拟
 * action=attribution: 五层归因
 * action=deadstock: 呆滞诊断
 * action=monthend: 月结检查
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertCostParams {
  action: 'simulate' | 'attribution' | 'deadstock' | 'monthend';
  data_json: string;
  params_json?: string;
}

async function handleExpertCost(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertCostParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);
    const extraParams = typed.params_json ? JSON.parse(typed.params_json) : {};

    const { simulateCost, calcAttribution, diagnoseDeadstockBatch, diagnoseMonthEnd } =
      await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'simulate':
        // simulateCost(productItem, materials, prices, params)
        result = simulateCost(
          data.productItem ?? data.item ?? '',
          data.materials ?? [],
          data.prices ?? new Map(),
          extraParams,
        );
        break;
      case 'attribution':
        // calcAttribution(productItem, current, previous)
        result = calcAttribution(
          data.productItem ?? data.item ?? '',
          data.current ?? {},
          data.previous ?? {},
        );
        break;
      case 'deadstock':
        // diagnoseDeadstockBatch(details, asOfDate)
        result = diagnoseDeadstockBatch(
          data.details ?? data ?? [],
          data.asOfDate ?? extraParams.asOfDate ?? new Date().toISOString().slice(0, 10),
        );
        break;
      case 'monthend':
        // diagnoseMonthEnd(period, exceptions)
        result = diagnoseMonthEnd(
          data.period ?? '',
          data.exceptions ?? [],
        );
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

export const expertCostTool: ToolDefinition = {
  name: 'yf_expert_cost',
  description:
    '成本会计专家引擎：BOM成本模拟 / 五层归因 / 呆滞诊断 / 月结检查。\n' +
    'action=simulate: BOM三步法成本模拟。data={productItem, materials, prices}\n' +
    'action=attribution: 五层穿透归因。data={productItem, current, previous}\n' +
    'action=deadstock: 呆滞诊断。data={details, asOfDate}\n' +
    'action=monthend: 月结四步诊断。data={period, exceptions}',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['simulate', 'attribution', 'deadstock', 'monthend'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
      params_json: { type: 'string', description: '可选参数 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertCost,
};
