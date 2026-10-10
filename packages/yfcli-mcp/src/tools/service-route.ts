/**
 * yf_service_route —— AI 助手路由。
 *
 * 输入关键词列表 → 匹配助手 ID 和服务名。
 * 数据驱动：路由表硬编码（后续可从 _routes.yaml 加载）。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ServiceRouteParams {
  keywords: string[];
  exclude_keywords?: string[];
}

interface AssistantEntry {
  id: string;
  name: string;
  keywords: string[];
  exclude: string[];
  service: string;
}

/** 易飞 AI 助手路由表（与 AGENTS.md 对齐） */
const ASSISTANTS: AssistantEntry[] = [
  { id: '01-inventory-aging', name: '库存呆滞查询', keywords: ['呆滞', '库龄', '呆料', '积压', '库存周转'], exclude: ['工单呆滞'], service: 'yf.ai.AIDeadStockInventory' },
  { id: '02-supplier-report', name: '供应商采购报告', keywords: ['供应商报告', '供应商分析', '准交率', '来料合格率'], exclude: ['客户'], service: 'yf.ai.SupplierPurchaseGet' },
  { id: '03-customer-report', name: '客户销售报告', keywords: ['客户报告', '客户分析', '准时发货率', '退货率'], exclude: ['供应商'], service: 'yf.ai.CustomerSalesDataGet' },
  { id: '04-production-report', name: '生产报告', keywords: ['生产报告', '完工率', '良率', '工时'], exclude: [], service: 'yf.ai.ProdReportQuery' },
  { id: '05-procurement-anomaly', name: '采购业务异常', keywords: ['采购异常', '采购预警', '超期交货', '价格异常'], exclude: ['工单'], service: 'yf.ai.PurchaseBusinessWarning' },
  { id: '06-purchase-tracking', name: '采购订单跟单', keywords: ['采购跟单', '采购进度', '采购订单跟踪'], exclude: ['销售'], service: 'yf.ai.PurchaseOrderTracking' },
  { id: '09-workorder-inactive', name: '工单呆滞查询', keywords: ['工单呆滞', '呆滞工单', 'WO呆滞'], exclude: ['库存呆滞'], service: 'yf.ai.WoinactiveWarning' },
  { id: '12-production-delay', name: '生产进度延迟', keywords: ['生产延迟', '生产延期', '进度延迟'], exclude: ['工单呆滞'], service: 'yf.ai.ProdDelayQuery' },
  { id: '13-sales-tracking', name: '销售订单跟单', keywords: ['销售跟单', '销售进度', '销售订单跟踪'], exclude: ['采购'], service: 'yf.ai.SalesOrderTracking' },
  { id: '16-sales-anomaly', name: '销售业务异常', keywords: ['销售异常', '销售预警', '销售超期'], exclude: ['采购'], service: 'yf.ai.SalesbusinessWarning' },
];

async function handleServiceRoute(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ServiceRouteParams;

  if (!typed.keywords || !Array.isArray(typed.keywords) || typed.keywords.length === 0) {
    return { error: "Missing or empty 'keywords' array" };
  }

  const excludeKeywords = typed.exclude_keywords ?? [];
  const candidates: AssistantEntry[] = [];

  for (const assistant of ASSISTANTS) {
    const excludedByInput = excludeKeywords.some((ek) => assistant.exclude.includes(ek));
    if (excludedByInput) continue;

    const matched = typed.keywords.some((kw) =>
      assistant.keywords.some((ak) => ak.includes(kw) || kw.includes(ak)),
    );
    if (matched) candidates.push(assistant);
  }

  if (candidates.length === 0) {
    return { matched: false };
  }

  const winner = candidates[0]!;
  return {
    matched: true,
    assistant_id: winner.id,
    service: winner.service,
  };
}

export const serviceRouteTool: ToolDefinition = {
  name: 'yf_service_route',
  description:
    `智能分析助手路由：输入关键词列表，匹配 ${ASSISTANTS.length} 个业务助手，` +
    '返回匹配的助手 ID 和 ERP 服务名。',
  inputSchema: {
    type: 'object',
    properties: {
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '关键词列表',
      },
      exclude_keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '排除关键词列表',
      },
    },
    required: ['keywords'],
  },
  handler: handleServiceRoute,
};
