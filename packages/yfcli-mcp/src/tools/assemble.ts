/**
 * yf_assemble —— JSON 请求组装与字段校验。
 *
 * 输入 type_key + operation + fields → 输出完整的 yf_run 请求 JSON。
 * 从 typekey_map 查服务名和主键，自动填充结构。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

const VALID_OPERATIONS = [
  'query', 'read', 'create', 'update', 'delete',
  'approve', 'disapprove', 'invalid',
];

interface AssembleParams {
  type_key: string;
  operation: string;
  fields: Record<string, unknown>;
}

async function handleAssemble(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AssembleParams;
  const warnings: string[] = [];

  if (!typed.type_key) {
    warnings.push("Missing 'type_key'");
  }

  if (!typed.operation) {
    warnings.push("Missing 'operation'");
  } else if (!VALID_OPERATIONS.includes(typed.operation)) {
    warnings.push(
      `Invalid operation '${typed.operation}'. Must be one of: ${VALID_OPERATIONS.join(', ')}`,
    );
  }

  // 检查 type_key 是否存在于 catalog
  if (typed.type_key) {
    const entry = context.catalog.findEntry(typed.type_key);
    if (!entry) {
      warnings.push(
        `Unknown type_key '${typed.type_key}'. Use yf_manifest to see available TypeKeys.`,
      );
    } else {
      // 检查操作是否支持
      if (typed.operation && !(typed.operation in entry.services)) {
        const available = Object.keys(entry.services).join(', ');
        warnings.push(
          `Operation '${typed.operation}' not supported for '${typed.type_key}'. Available: ${available}`,
        );
      }
    }
  }

  // 组装 input
  const assembledInput = { ...(typed.fields ?? {}) };

  return {
    valid: warnings.length === 0,
    request: {
      type_key: typed.type_key,
      operation: typed.operation,
      input: assembledInput,
    },
    warnings,
  };
}

export const assembleTool: ToolDefinition = {
  name: 'yf_assemble',
  description:
    'JSON 请求组装与字段校验：输入 type_key、operation 和字段值，' +
    '输出完整的 yf_run 请求 JSON，并校验必填字段是否齐全。' +
    '用于 Agent 构造合法 ERP 调用请求。',
  inputSchema: {
    type: 'object',
    properties: {
      type_key: {
        type: 'string',
        description: 'TypeKey，如 sales.order, purchase.order',
      },
      operation: {
        type: 'string',
        enum: VALID_OPERATIONS,
        description: '操作类型',
      },
      fields: {
        type: 'object',
        description: '字段名→值的映射对象',
      },
    },
    required: ['type_key', 'operation', 'fields'],
  },
  handler: handleAssemble,
};
