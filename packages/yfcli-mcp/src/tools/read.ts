/**
 * yf_read —— 按主键读取业务对象数据。
 *
 * 对应易飞 OpenAPI 的 read 类服务。
 * 复合主键极普遍，datakeys 必须含全部主键字段。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ReadParams {
  type_key: string;
  datakeys: Array<Record<string, string>>;
}

async function handleRead(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ReadParams;

  if (!typed.type_key) {
    return { error: '缺少必填参数 type_key' };
  }
  if (!typed.datakeys || !Array.isArray(typed.datakeys) || typed.datakeys.length === 0) {
    return { error: '缺少必填参数 datakeys（主键数组）' };
  }

  try {
    const result = await context.client.action(typed.type_key, 'read', {
      datakeys: typed.datakeys,
    });

    return {
      type_key: typed.type_key,
      item_count: result.items.length,
      empty: result.empty,
      rows: result.items,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message, type_key: typed.type_key };
  }
}

export const readTool: ToolDefinition = {
  name: 'yf_read',
  description:
    '按主键读取易飞 ERP 业务对象数据。' +
    'datakeys 是主键对象数组，每笔一条，必须含全部主键字段（复合主键极普遍）。' +
    '例如 supplier 的主键是 supplier_no，sales.order 的主键是 doc_type_no + doc_no。',
  inputSchema: {
    type: 'object',
    properties: {
      type_key: {
        type: 'string',
        description: '业务对象标识，如 supplier / customer',
      },
      datakeys: {
        type: 'array',
        description: '主键对象数组，每个对象包含全部主键字段',
        items: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    required: ['type_key', 'datakeys'],
  },
  handler: handleRead,
};
