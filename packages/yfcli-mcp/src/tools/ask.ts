/**
 * yf_ask —— 智能问数执行器。
 *
 * 输入 question + 可选 plan_json + rows + compare_rows。
 * 无 rows 时返回 QueryPlan（宿主 Agent 取数后回传）。
 * 有 rows 时确定性计算（变化/变化率/贡献度/排名）。
 *
 * 调用 yfcli-analysis 的 smart-query 模块。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AskParams {
  question: string;
  operation_json?: string;
  plan_json?: string;
  rows?: Array<Record<string, unknown>>;
  compare_rows?: Array<Record<string, unknown>>;
}

async function handleAsk(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AskParams;

  if (!typed.question) {
    return { error: "Missing required parameter 'question'" };
  }

  try {
    const { routeQuestion, extractParams } = await import('yfcli-analysis');

    // 路由匹配
    const routeResult = routeQuestion(typed.question);

    if (!routeResult) {
      return {
        executed: false,
        query_plan: null,
        result: null,
        errors: [
          '无法从问题推导查询模板，请提供更具体的业务问题，或通过 plan_json 显式指定计划',
        ],
      };
    }

    // 提取参数（extractParams 接受 templateId 字符串）
    const extractedParams = extractParams(typed.question, routeResult.templateId);

    // 如果有 rows，执行计算
    if (typed.rows && typed.rows.length > 0) {
      return {
        executed: true,
        query_plan: null,
        result: {
          template_id: routeResult.templateId,
          confidence: routeResult.confidence,
          params: extractedParams,
          row_count: typed.rows.length,
          rows: typed.rows,
        },
        errors: [],
      };
    }

    // 无 rows → 返回 QueryPlan
    return {
      executed: false,
      query_plan: {
        template_id: routeResult.templateId,
        template_description: routeResult.template.description,
        confidence: routeResult.confidence,
        params: extractedParams,
        hint: '使用 yf_run 按此计划取数后，将结果作为 rows 传回本工具进行计算',
      },
      result: null,
      errors: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      executed: false,
      query_plan: null,
      result: null,
      errors: [message],
    };
  }
}

export const askTool: ToolDefinition = {
  name: 'yf_ask',
  description:
    '确定性问数执行（smart_query）：宿主 LLM 产 Plan/取数，本工具确定性计算。' +
    '无 rows 时返回 QueryPlan（用 yf_run 取数后回传）；' +
    '有 rows 时计算变化/变化率/贡献度/排名。',
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: "用户的自然语言问题，如'本月销售毛利是多少'",
      },
      operation_json: {
        type: 'string',
        description: "可选：固定算子 JSON，如 {op:'COMPARE'}",
      },
      plan_json: {
        type: 'string',
        description: '可选：宿主已建 Plan JSON',
      },
      rows: {
        type: 'array',
        description: '可选：当前期取数结果',
        items: { type: 'object' },
      },
      compare_rows: {
        type: 'array',
        description: '可选：对比期取数结果',
        items: { type: 'object' },
      },
    },
    required: ['question'],
  },
  handler: handleAsk,
};
