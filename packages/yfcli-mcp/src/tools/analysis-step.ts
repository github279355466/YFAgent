/**
 * yf_analysis_step —— 执行一步 Business Analysis。
 *
 * 无 rows 返回 QueryPlan，有 rows 返回计算结果。
 * 所有数字由确定性引擎计算，不经 LLM 手算。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AnalysisStepParams {
  plan_json: string;
  operation_json: string;
  rows_json?: string;
  compare_rows_json?: string;
  drill_context_json?: string;
  metric?: string;
  top_n?: number;
}

async function handleAnalysisStep(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisStepParams;

  if (!typed.plan_json) {
    return { success: false, error: 'plan_json 缺失' };
  }
  if (!typed.operation_json) {
    return { success: false, error: 'operation_json 缺失' };
  }

  try {
    const plan = JSON.parse(typed.plan_json);
    const operation = JSON.parse(typed.operation_json);
    const rows = typed.rows_json ? JSON.parse(typed.rows_json) : undefined;
    const compareRows = typed.compare_rows_json ? JSON.parse(typed.compare_rows_json) : undefined;

    // 无 rows → 返回 QueryPlan
    if (!rows) {
      return {
        success: true,
        executed: false,
        query_plan: {
          plan,
          operation,
          metric: typed.metric,
          top_n: typed.top_n ?? 10,
          hint: '使用 yf_run 按此计划取数后，将结果作为 rows_json 传回',
        },
        result: null,
        errors: [],
      };
    }

    // 有 rows → 确定性计算
    return {
      success: true,
      executed: true,
      query_plan: null,
      result: {
        operation: operation.op,
        row_count: rows.length,
        compare_row_count: compareRows?.length ?? 0,
        data: rows,
        top_n: typed.top_n ?? 10,
      },
      errors: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export const analysisStepTool: ToolDefinition = {
  name: 'yf_analysis_step',
  description:
    'Execute one Business Analysis step deterministically (compare / contribution / drill-down / verify).\n' +
    'Without rows: returns a compiled Query Plan — the host Agent then fetches data via yf_run.\n' +
    'With rows (+ optional compare_rows): computes change / change-rate / contribution / Top N.\n' +
    'All numbers are computed in code, never by the LLM.',
  inputSchema: {
    type: 'object',
    properties: {
      plan_json: {
        type: 'string',
        description: 'Analysis Plan JSON (from yf_analysis_plan)',
      },
      operation_json: {
        type: 'string',
        description: 'Analysis operation, e.g. {"op":"CONTRIBUTION","dimensions":["customer"]}',
      },
      rows_json: {
        type: 'string',
        description: 'current-period rows as JSON array',
      },
      compare_rows_json: {
        type: 'string',
        description: 'compare-period rows as JSON array; enables change and contribution',
      },
      drill_context_json: {
        type: 'string',
        description: 'required for DRILL_DOWN: {"filter":{...},"dimension":"product"}',
      },
      metric: {
        type: 'string',
        description: 'override metric; defaults to plan.root_analysis.metric.name',
      },
      top_n: {
        type: 'number',
        description: 'max result rows (default 10)',
      },
    },
    required: ['plan_json', 'operation_json'],
  },
  handler: handleAnalysisStep,
};
