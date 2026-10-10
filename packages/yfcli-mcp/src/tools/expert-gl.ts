/**
 * yf_expert_gl —— 总账会计专家引擎。
 *
 * action=voucher: 凭证校验
 * action=close: 结账前置检查
 * action=report: 报表生成+勾稽
 * action=income_summary: 结转损益
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ExpertGlParams {
  action: 'voucher' | 'close' | 'report' | 'income_summary';
  data_json: string;
}

async function handleExpertGl(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ExpertGlParams;

  if (!typed.action) return { error: "Missing 'action'" };
  if (!typed.data_json) return { error: "Missing 'data_json'" };

  try {
    const data = JSON.parse(typed.data_json);

    const { validateVoucher, checkPeriodClose, buildBalanceSheetTemplate, summarizeIncomeClosing } =
      await import('yfcli-experts');

    let result: unknown;
    switch (typed.action) {
      case 'voucher':
        // validateVoucher(voucher) — single arg
        result = validateVoucher(data.voucher ?? data);
        break;
      case 'close':
        // checkPeriodClose(status)
        result = checkPeriodClose(data);
        break;
      case 'report':
        // buildBalanceSheetTemplate(period, company)
        result = buildBalanceSheetTemplate(
          data.period ?? '',
          data.company ?? '',
        );
        break;
      case 'income_summary':
        // summarizeIncomeClosing(entries)
        result = summarizeIncomeClosing(data.entries ?? data);
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

export const expertGlTool: ToolDefinition = {
  name: 'yf_expert_gl',
  description:
    '总账会计专家引擎：凭证校验 / 结账检查 / 报表生成 / 勾稽校验。\n' +
    'action=voucher: 凭证校验。data={voucher}\n' +
    'action=close: 结账前置检查。data=PeriodStatus\n' +
    'action=report: 报表生成。data={period, company}\n' +
    'action=income_summary: 结转损益。data={entries}',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['voucher', 'close', 'report', 'income_summary'], description: '操作类型' },
      data_json: { type: 'string', description: '输入数据 JSON' },
    },
    required: ['action', 'data_json'],
  },
  handler: handleExpertGl,
};
