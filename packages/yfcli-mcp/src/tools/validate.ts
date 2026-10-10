/**
 * yf_validate —— 校验请求 JSON 结构。
 *
 * 纯本地校验，不调用 ERP。
 * 易飞特有规则：
 *   - conditions 必须是对象形态 { operator, fields }，不是数组
 *   - page_size <= 10000
 *   - page_no >= 1
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

const VALID_OPERATIONS = [
  'query', 'read', 'create', 'update', 'delete',
  'approve', 'disapprove', 'invalid',
];

const MAX_PAGE_SIZE = 10000;

interface ValidateParams {
  request: Record<string, unknown>;
}

function validateRequest(request: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必填字段
  if (!request.type_key || typeof request.type_key !== 'string') {
    errors.push("Missing or invalid 'type_key' (must be a non-empty string)");
  }

  if (!request.operation || typeof request.operation !== 'string') {
    errors.push("Missing or invalid 'operation' (must be a non-empty string)");
  } else if (!VALID_OPERATIONS.includes(request.operation)) {
    errors.push(
      `Invalid operation '${request.operation}'. Must be one of: ${VALID_OPERATIONS.join(', ')}`,
    );
  }

  if (errors.length > 0) {
    return { success: false, error: { type: 'validation_error', message: errors.join('; ') } };
  }

  const input = (request.input ?? {}) as Record<string, unknown>;
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      success: false,
      error: { type: 'validation_error', message: "'input' must be an object" },
    };
  }

  const operation = request.operation as string;

  // query 操作的特殊校验
  if (operation === 'query') {
    // page_size
    if (input.page_size !== undefined) {
      const ps = input.page_size;
      if (typeof ps !== 'number' || ps < 1 || ps > MAX_PAGE_SIZE) {
        errors.push(`Invalid 'page_size': must be between 1 and ${MAX_PAGE_SIZE}`);
      }
    }

    // page_no
    if (input.page_no !== undefined) {
      const pn = input.page_no;
      if (typeof pn !== 'number' || pn < 1) {
        errors.push("Invalid 'page_no': must be >= 1");
      }
    }

    // conditions 必须是对象形态（易飞特有）
    if (input.conditions !== undefined) {
      const conds = input.conditions;
      if (Array.isArray(conds)) {
        errors.push(
          "Invalid 'conditions': must be an object { operator, fields } in YF, not an array. " +
          'Array form is the YZ (易助) format and will silently fail in YF.',
        );
      } else if (typeof conds === 'object' && conds !== null) {
        const condObj = conds as Record<string, unknown>;
        if (!condObj.fields || !Array.isArray(condObj.fields)) {
          warnings.push("'conditions' object should have a 'fields' array");
        }
      }
    }
  }

  // read/delete/approve/disapprove/invalid 需要 datakeys
  const datakeysOps = ['read', 'delete', 'approve', 'disapprove', 'invalid'];
  if (datakeysOps.includes(operation)) {
    if (!input.datakeys || !Array.isArray(input.datakeys)) {
      errors.push(`Operation '${operation}' requires 'datakeys' (array of primary key objects)`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: { type: 'validation_error', message: errors.join('; ') },
      warnings,
    };
  }

  return {
    success: true,
    request: { type_key: request.type_key, operation, input },
    warnings,
  };
}

async function handleValidate(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ValidateParams;

  if (!typed.request || typeof typed.request !== 'object') {
    return {
      success: false,
      error: { type: 'validation_error', message: "Missing 'request' object" },
    };
  }

  return validateRequest(typed.request);
}

export const validateTool: ToolDefinition = {
  name: 'yf_validate',
  description:
    'Validate an ERP request JSON structure before executing it. ' +
    'Checks required fields (type_key, operation, input), operation validity, ' +
    'and YF-specific structural rules: conditions must be object form (not array), ' +
    'page_size <= 10000. Use this to catch errors before calling yf_run.',
  inputSchema: {
    type: 'object',
    properties: {
      request: {
        type: 'object',
        description:
          'The request object to validate. Must contain type_key (string), operation (string), and input (object).',
      },
    },
    required: ['request'],
  },
  handler: handleValidate,
};
