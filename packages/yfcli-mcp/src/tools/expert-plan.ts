/**
 * yf_expert_plan —— 计划专家引擎。
 *
 * action=kit_check: 齐套分析
 * action=atp: ATP交付承诺
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertPlanParams {
  action: 'kit_check' | 'atp';
  data_json: string;
}

async function handleExpertPlan(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertPlanParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);

    const { checkKit, calcAtp } = await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'kit_check':
        // checkKit(workOrders, bomEntries, availability)
        result = checkKit(
          data.workOrders ?? data.work_orders ?? [],
          data.bomEntries ?? data.bom_entries ?? [],
          data.availability ?? [],
        );
        break;
      case 'atp':
        // calcAtp(input)
        result = calcAtp(data);
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

export const expertPlanTool: ToolDefinition = {
  name: 'yf_expert_plan',
  description:
    '计划专家引擎：物料齐套分析 / ATP交付承诺。\n' +
    'action=kit_check: 齐套分析。data={workOrders, bomEntries, availability}\n' +
    'action=atp: ATP交付承诺。data=AtpInput',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['kit_check', 'atp'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertPlan,
};
