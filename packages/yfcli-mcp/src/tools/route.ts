/**
 * yf_route —— 操作路由决策树。
 *
 * 输入自然语言意图（查询/创建/更新/审批/删除 + 业务对象），
 * 返回映射的 type_key、operation、必填字段。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

/** 业务对象 -> TypeKey 映射表（易飞常用对象） */
const BUSINESS_OBJECT_MAP: Record<string, string> = {
  sales_order: 'sales.order',
  purchase_order: 'purchase.order',
  inventory: 'inventory',
  customer: 'customer',
  supplier: 'supplier',
  item: 'item',
  production_order: 'manufacture.workorder',
  bom: 'bom',
  voucher: 'accounting.voucher',
  account: 'account',
};

/** 意图 -> 操作映射 */
const INTENT_OPERATION_MAP: Record<string, string> = {
  query: 'query',
  create: 'create',
  update: 'update',
  approve: 'approve',
  delete: 'delete',
};

/** 操作 -> 必填字段映射 */
const OPERATION_FIELDS: Record<string, string[]> = {
  query: [],
  read: ['datakeys'],
  create: [],
  update: [],
  delete: ['datakeys'],
  approve: ['datakeys'],
  disapprove: ['datakeys'],
  invalid: ['datakeys'],
};

interface RouteParams {
  intent_type: string;
  business_object: string;
  has_doc_no?: boolean;
  conditions?: Array<{ field: string; value: string; operator?: string }>;
}

async function handleRoute(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as RouteParams;

  if (!typed.intent_type) {
    return { error: "Missing 'intent_type'" };
  }
  if (!typed.business_object) {
    return { error: "Missing 'business_object'" };
  }

  const typeKey = BUSINESS_OBJECT_MAP[typed.business_object];
  if (!typeKey) {
    return {
      type_key: null,
      operation: INTENT_OPERATION_MAP[typed.intent_type] ?? 'query',
      fields: [],
      error:
        `Unknown business_object: '${typed.business_object}'. ` +
        `Supported: ${Object.keys(BUSINESS_OBJECT_MAP).join(', ')}`,
    };
  }

  let operation = INTENT_OPERATION_MAP[typed.intent_type] ?? 'query';

  // 有单号 → 查询用 read
  if (typed.intent_type === 'query' && typed.has_doc_no) {
    operation = 'read';
  }

  const fields = OPERATION_FIELDS[operation] ?? [];

  return {
    type_key: typeKey,
    operation,
    fields,
  };
}

export const routeTool: ToolDefinition = {
  name: 'yf_route',
  description:
    '操作路由决策树：输入自然语言意图（查询/创建/更新/审批/删除 + 业务对象），' +
    '返回映射的 type_key、operation 和必填字段。' +
    '用于将 Agent 模糊意图翻译为精确的 ERP 调用参数。',
  inputSchema: {
    type: 'object',
    properties: {
      intent_type: {
        type: 'string',
        enum: ['query', 'create', 'update', 'approve', 'delete'],
        description: '操作意图类型',
      },
      business_object: {
        type: 'string',
        description:
          '业务对象，如 sales_order, purchase_order, inventory, customer, supplier, item, production_order',
      },
      has_doc_no: {
        type: 'boolean',
        description: '是否有单号（有单号时查询会使用 read）',
      },
      conditions: {
        type: 'array',
        description: '查询条件列表',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            value: { type: 'string' },
            operator: { type: 'string' },
          },
          required: ['field', 'value'],
        },
      },
    },
    required: ['intent_type', 'business_object'],
  },
  handler: handleRoute,
};
