/**
 * yf_analysis_plan —— Business Analysis Plan 的创建与校验。
 *
 * action=create: 从业务问题创建分析计划
 * action=validate: 验证已有计划
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AnalysisPlanParams {
  action: 'create' | 'validate';
  question?: string;
  analysis_type?: string;
  objective?: string;
  subject?: string;
  plan_json?: string;
}

async function handleAnalysisPlan(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisPlanParams;

  if (!typed.action) {
    return { success: false, error: "Missing 'action' (create or validate)" };
  }

  if (typed.action === 'validate') {
    if (!typed.plan_json) {
      return { success: false, error: 'validate 需要 plan_json' };
    }

    try {
      const parsed = JSON.parse(typed.plan_json);
      // 基本结构校验
      const valid = typeof parsed === 'object' && parsed !== null;
      return {
        success: valid,
        action: 'validate',
        validation: {
          valid,
          errors: valid ? [] : ['plan_json 不是有效的对象'],
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `plan_json 解析失败：${message}` };
    }
  }

  // create
  if (!typed.question) {
    return { success: false, error: 'create 需要 question' };
  }

  try {
    const { routeQuestion } = await import('yfcli-analysis');
    const routeResult = routeQuestion(typed.question);

    const plan = {
      user_question: typed.question,
      analysis_type: typed.analysis_type ?? (routeResult ? 'smart_query' : 'business_analysis'),
      objective: typed.objective ?? 'answer_query',
      subject: typed.subject,
      route: routeResult
        ? { template_id: routeResult.templateId, confidence: routeResult.confidence }
        : null,
    };

    return {
      success: true,
      action: 'create',
      plan,
      hint: routeResult
        ? '该问题匹配到查询模板，建议改用 yf_ask；若确实需要多轮调查，可显式传入 analysis_type=business_analysis 覆盖。'
        : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export const analysisPlanTool: ToolDefinition = {
  name: 'yf_analysis_plan',
  description:
    'Business Analysis plan: create from a business question, or validate an existing plan.\n' +
    'Use when the user asks WHY / root cause / anomaly / contributing factors.\n' +
    'For a definite lookup (how much / top N / trend) use yf_ask instead.\n' +
    'Returns { route, plan, validation }. Never executes ERP calls.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'validate'],
        description: 'create a new plan, or validate an existing one',
      },
      question: {
        type: 'string',
        description: "user's business question (required for create)",
      },
      analysis_type: {
        type: 'string',
        description: 'analysis type; auto-derived from intent when omitted',
      },
      objective: {
        type: 'string',
        description: '分析目标；省略时按意图推导',
      },
      subject: {
        type: 'string',
        description: '业务域，如 sales / inventory / profit',
      },
      plan_json: {
        type: 'string',
        description: 'Analysis Plan JSON string (required for validate)',
      },
    },
    required: ['action'],
  },
  handler: handleAnalysisPlan,
};
