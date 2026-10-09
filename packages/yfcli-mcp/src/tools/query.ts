/**
 * yf_query —— 查询业务对象数据。
 *
 * 对应易飞 OpenAPI 的 query 类服务。
 * 注意：易飞无 fastquery，每次调用重查数据库。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import type { YfQueryParameter, YfConditionField, YfConditions } from 'yfcli-sdk';

interface QueryParams {
  type_key: string;
  conditions?: Array<{
    field_name: string;
    operator: string;
    value: string;
    node_name?: string;
  }>;
  page_no?: number;
  page_size?: number;
}

async function handleQuery(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as QueryParams;

  if (!typed.type_key) {
    return { error: '缺少必填参数 type_key' };
  }

  // YfQueryParameter extends YfPagination（page_no / page_size / use_has_next 在顶层）
  let conditionsBlock: YfConditions | undefined;
  if (typed.conditions && typed.conditions.length > 0) {
    const fields: YfConditionField[] = typed.conditions.map((c) => ({
      field_name: c.field_name,
      operator: c.operator as YfConditionField['operator'],
      value: c.value,
      ...(c.node_name ? { node_name: c.node_name } : {}),
    }));

    conditionsBlock = {
      operator: 'AND',
      fields,
    };
  }

  const queryParam: YfQueryParameter = {
    page_no: typed.page_no ?? 1,
    page_size: typed.page_size ?? 100,
    use_has_next: true,
    conditions: conditionsBlock ?? { operator: 'AND', fields: [] },
  };

  try {
    const result = await context.client.query(typed.type_key, queryParam);
    return {
      type_key: typed.type_key,
      total_result: result.totalResult,
      has_next: result.hasNext,
      count: result.rows.length,
      rows: result.rows,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message, type_key: typed.type_key };
  }
}

export const queryTool: ToolDefinition = {
  name: 'yf_query',
  description:
    '查询易飞 ERP 业务对象数据。支持条件过滤和分页。' +
    '注意：易飞无 fastquery，每次调用重查数据库，page_size 建议不超过 500。' +
    'conditions 中的 operator 支持 =, !=, >, <, >=, <=, LIKE, IN, NOT IN, BETWEEN, EXISTS, NOT EXISTS。',
  inputSchema: {
    type: 'object',
    properties: {
      type_key: {
        type: 'string',
        description: '业务对象标识，如 supplier / customer / sales.order',
      },
      conditions: {
        type: 'array',
        description: '查询条件数组（AND 关系）',
        items: {
          type: 'object',
          properties: {
            field_name: { type: 'string', description: '字段名' },
            operator: { type: 'string', description: '运算符' },
            value: { type: 'string', description: '值' },
            node_name: { type: 'string', description: '节点名（查单身字段时必填）' },
          },
          required: ['field_name', 'operator', 'value'],
        },
      },
      page_no: { type: 'number', description: '页码（从 1 开始）' },
      page_size: { type: 'number', description: '每页条数（最大 10000）' },
    },
    required: ['type_key'],
  },
  handler: handleQuery,
};
