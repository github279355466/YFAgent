/**
 * 智能问数路由（MVP 最小实现）
 *
 * MVP 阶段不做 LLM 调用，只做关键词路由 + 参数抽取的规则引擎。
 * 后续可接入 LLM 做意图识别和参数提取。
 *
 * 流程：routeQuestion → extractParams → executeAndFormat
 */
import type { SqlTemplate } from "../runtime/sql/template.js";
import { BUILTIN_TEMPLATES } from "../runtime/sql/templates.js";

/** 关键词 → 模板 id 映射规则 */
interface RouteRule {
  keywords: string[];
  templateId: string;
}

const ROUTE_RULES: RouteRule[] = [
  { keywords: ["销售毛利", "毛利", "销货毛利"], templateId: "sales_margin_by_order" },
  { keywords: ["库存成本", "库存金额", "存货成本"], templateId: "inventory_cost_by_item" },
  { keywords: ["采购汇总", "采购金额", "采购统计"], templateId: "purchase_summary_by_supplier" },
  { keywords: ["应收余额", "应收账款", "欠款"], templateId: "ar_balance_by_customer" },
  { keywords: ["应付余额", "应付账款", "应付款"], templateId: "ap_balance_by_supplier" },
  { keywords: ["生产成本", "工单成本"], templateId: "production_cost_by_workorder" },
  { keywords: ["科目余额", "借贷方", "发生额"], templateId: "gl_balance_by_period" },
  { keywords: ["收款", "收款金额"], templateId: "collection_by_customer" },
  { keywords: ["付款", "付款金额"], templateId: "payment_by_supplier" },
];

export interface RouteResult {
  templateId: string;
  template: SqlTemplate;
  confidence: number;
}

/**
 * 根据关键词匹配模板。
 * 返回匹配度最高的模板；无匹配返回 null。
 */
export function routeQuestion(question: string): RouteResult | null {
  const normalized = question.toLowerCase();
  let bestMatch: RouteResult | null = null;

  for (const rule of ROUTE_RULES) {
    const matchedCount = rule.keywords.filter((kw) => normalized.includes(kw)).length;
    if (matchedCount > 0) {
      const confidence = matchedCount / rule.keywords.length;
      if (!bestMatch || confidence > bestMatch.confidence) {
        const template = BUILTIN_TEMPLATES.find((t) => t.id === rule.templateId);
        if (template) {
          bestMatch = { templateId: rule.templateId, template, confidence };
        }
      }
    }
  }

  return bestMatch;
}

/** 日期正则：YYYYMMDD */
const DATE_PATTERN = /\b(\d{8})\b/g;

/**
 * 从问题文本中抽取参数（MVP 规则引擎）。
 * 支持：日期范围、客户名/供应商名（TODO）。
 */
export function extractParams(
  question: string,
  templateId: string,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return params;

  // 抽取日期
  const dates: string[] = [];
  for (const m of question.matchAll(DATE_PATTERN)) {
    dates.push(m[1]!);
  }
  dates.sort();

  const needsStartDate = template.params.some((p) => p.name === "start_date");
  const needsEndDate = template.params.some((p) => p.name === "end_date");
  const needsYearMonth = template.params.some((p) => p.name === "year_month");

  if (needsStartDate && dates.length >= 1) {
    params["start_date"] = dates[0]!;
  }
  if (needsEndDate && dates.length >= 2) {
    params["end_date"] = dates[dates.length - 1]!;
  } else if (needsEndDate && dates.length === 1) {
    // 只有一个日期时，起止相同
    params["end_date"] = dates[0]!;
  }
  if (needsYearMonth && dates.length >= 1) {
    // 取前 6 位作为 YYYYMM
    params["year_month"] = dates[0]!.substring(0, 6);
  }

  // 填充可选参数的默认值
  for (const p of template.params) {
    if (params[p.name] === undefined && !p.required && p.default !== undefined) {
      params[p.name] = p.default;
    }
  }

  return params;
}

export interface QueryResult {
  templateId: string;
  label: string;
  description: string;
  rows: Record<string, unknown>[];
  rowCount: number;
  /** 口径标签（统计数字必须带） */
  caliberNote: string;
}

/**
 * 执行模板并格式化输出（带口径标签）。
 * driver 由调用方注入。
 */
export async function executeAndFormat(
  templateId: string,
  params: Record<string, unknown>,
  executor: {
    execute: (id: string, p: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  },
): Promise<QueryResult> {
  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`模板未找到：${templateId}`);
  }

  const rows = await executor.execute(templateId, params);

  return {
    templateId,
    label: template.label,
    description: template.description ?? "",
    rows,
    rowCount: rows.length,
    caliberNote: buildCaliberNote(template),
  };
}

function buildCaliberNote(t: SqlTemplate): string {
  const parts: string[] = [`口径：${t.label}`];
  if (t.params.some((p) => p.name === "approve_status")) {
    parts.push("仅已审核(Y)");
  }
  if (t.params.some((p) => p.name === "start_date")) {
    parts.push("按日期范围过滤");
  }
  return parts.join("，");
}
