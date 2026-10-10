/**
 * yf_query —— 查询业务对象数据。
 *
 * 对应易飞 OpenAPI 的 query 类服务。
 * 注意：易飞无 fastquery，每次调用重查数据库。
 *
 * ⚠️ 条件构造统一走 SDK 的 allOf / allRecords，产出的逻辑操作符是**小写** and。
 * 此前本文件硬编码大写 "AND"，真机会导致 conditions 被静默丢弃、返回未过滤数据
 * （2026-10-10 事故根因）。逻辑操作符大小写是协议硬约束：and / or，不得写成 AND / OR。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import type { YfQueryParameter, YfConditionField, YfConditions } from 'yfcli-sdk';
import { allRecords, allOf } from 'yfcli-sdk';

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

/**
 * 把 Agent 传入的条件数组收敛为易飞协议字段，并做入参校验。
 *
 * 校验的意义：字段名/运算符非法时**必须显式报错**。服务端对无法求值的条件
 * 会静默丢弃并返回未过滤的全量数据（不报错），这是 2026-10-10 事故的放大器 ——
 * 若第一次调用就报错，问题不会伪装成「查询成功」。
 */
function buildConditionFields(
  conditions: NonNullable<QueryParams['conditions']>,
): YfConditionField[] {
  return conditions.map((c, index) => {
    const isExistential = c.operator === 'EXISTS' || c.operator === 'NOT EXISTS';

    if (typeof c.operator !== 'string' || c.operator.trim() === '') {
      throw new TypeError(
        `conditions[${index}].operator 缺失或为空（字段 "${c.field_name}"）。` +
          '空运算符会被服务端静默丢弃，导致条件失效、返回未过滤数据。',
      );
    }
    // EXISTS / NOT EXISTS 的 field_name 必须留空，其余运算符必须给出字段名。
    if (!isExistential && (typeof c.field_name !== 'string' || c.field_name.trim() === '')) {
      throw new TypeError(
        `conditions[${index}].field_name 缺失或为空。` +
          '非法字段名若被静默忽略，服务端会返回未过滤的全量数据而不报错；' +
          '仅 EXISTS / NOT EXISTS 允许 field_name 留空。',
      );
    }

    return {
      field_name: c.field_name,
      operator: c.operator as YfConditionField['operator'],
      value: c.value,
      ...(c.node_name ? { node_name: c.node_name } : {}),
    };
  });
}

async function handleQuery(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as QueryParams;

  if (!typed.type_key) {
    return { error: '缺少必填参数 type_key' };
  }

  try {
    // YfQueryParameter extends YfPagination（page_no / page_size / use_has_next 在顶层）
    let conditionsBlock: YfConditions | undefined;
    if (typed.conditions && typed.conditions.length > 0) {
      // 用 SDK 构造器产出小写 and 的组合，避免手写大写操作符再次踩坑。
      conditionsBlock = allOf(buildConditionFields(typed.conditions));
    }

    const queryParam: YfQueryParameter = {
      page_no: typed.page_no ?? 1,
      page_size: typed.page_size ?? 100,
      use_has_next: true,
      conditions: conditionsBlock ?? allRecords(),
    };

    const result = await context.client.query(typed.type_key, queryParam);
    // ⚠️ 易飞 query 回参的 total_result 不是「符合条件的总行数」，而是「本页行数 + 1」
    //    的分页哨兵（随 page_size 漂移）。真机实测（账套销单 928 条）：
    //      page_size=1 → total_result=2；5 → 6；50 → 51；1000（一次取完）→ 928。
    //    调用方若把它当业务总数会得到严重偏小的静默错误，故此处不直接命名为 total，
    //    只作为分页提示回传，并把可靠取数方式写进返回体。
    const pageHint = result.totalResult;
    return {
      type_key: typed.type_key,
      count: result.rows.length,
      has_next: result.hasNext,
      page_hint: pageHint,
      total_result: pageHint,
      total_result_semantics:
        '分页哨兵，非总行数（实测 = 本页行数 + 1，随 page_size 漂移）。' +
        '需要业务总数时：把 page_size 放大到一次取完（上限 10000），或翻页累加 count；' +
        '翻页依据用 has_next，不要用 total_result。',
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
    '⚠️ 返回的 total_result 是「本页行数 + 1」的分页哨兵，**不是总行数**' +
    '（随 page_size 漂移）。要业务总数请把 page_size 放大到一次取完（上限 10000）' +
    '或翻页累加 count；翻页依据用 has_next。' +
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
