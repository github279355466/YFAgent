/**
 * yf_validate —— 校验请求 JSON 结构。
 *
 * 纯本地校验，不调用 ERP。
 * 易飞特有规则：
 *   - conditions 必须是对象形态 { operator, fields }，不是数组
 *   - page_size <= 10000
 *   - page_no >= 1
 *   - 枚举字段的值若为回参形态（"Y." / "Y.已审核"），提示改传纯编码
 */


import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import type { YfEnumFieldSpec } from 'yfcli-sdk';
import { extractCodeAgainstSet, looksLikeCodeText, extractCode } from 'yfcli-sdk';

const VALID_OPERATIONS = [
  'query', 'read', 'create', 'update', 'delete',
  'approve', 'disapprove', 'invalid',
];

const MAX_PAGE_SIZE = 10000;

interface ValidateParams {
  request: Record<string, unknown>;
}

function validateRequest(
  request: Record<string, unknown>,
  enumSpecs?: Readonly<Record<string, YfEnumFieldSpec>>,
): Record<string, unknown> {
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
        // 逻辑操作符大小写是协议硬约束：只能小写 and / or。
        // 大写会被服务端静默丢弃，返回未过滤的全量数据而不报错（2026-10-10 事故）。
        const logical = condObj.operator;
        if (logical !== undefined) {
          if (typeof logical !== 'string' || !['and', 'or'].includes(logical)) {
            errors.push(
              "Invalid 'conditions.operator': must be lowercase 'and' or 'or' " +
                `(received ${JSON.stringify(logical)}). Uppercase "AND"/"OR" makes the server ` +
                'silently drop the whole condition and return unfiltered rows.',
            );
          }
        }
        // 段内条件逐条校验：空 field_name（非 EXISTS）与空 operator 都会被静默忽略。
        const condFields = condObj.fields;
        if (Array.isArray(condFields)) {
          condFields.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) {
              errors.push(`conditions.fields[${index}] must be an object`);
              return;
            }
            const field = item as Record<string, unknown>;
            const op = field.operator;
            if (typeof op !== 'string' || op.trim() === '') {
              errors.push(`conditions.fields[${index}].operator is missing or empty`);
            }
            const isExistential = op === 'EXISTS' || op === 'NOT EXISTS';
            if (
              !isExistential &&
              (typeof field.field_name !== 'string' || field.field_name.trim() === '')
            ) {
              errors.push(
                `conditions.fields[${index}].field_name is missing or empty ` +
                  '(only EXISTS / NOT EXISTS may leave it blank)',
              );
            }

            // 枚举字段：值若是回参形态（"Y." / "Y.已审核"）则提示改传纯编码。
            // 服务端对枚举条件只认纯编码，传完整串会静默返回 0 条或未过滤数据。
            // 仅对已登记在枚举字典中的字段生效 —— 数值字段（如 order_amount="2.65"）
            // 不在字典内，天然不受影响。
            const spec = enumSpecs?.[field.field_name as string];
            const value = field.value;
            if (spec?.codedText && typeof value === 'string' && value !== '') {
              const suggested =
                spec.codes !== undefined && spec.codes.size > 0
                  ? extractCodeAgainstSet(value, spec.codes)
                  : looksLikeCodeText(value)
                    ? extractCode(value)
                    : undefined;
              if (suggested !== undefined && suggested !== value) {
                errors.push(
                  `conditions.fields[${index}].value for enum field '${String(field.field_name)}' ` +
                    `is the response form ${JSON.stringify(value)}; pass the bare code ` +
                    `${JSON.stringify(suggested)} instead ` +
                    '(enum conditions only match the plain code).',
                );
              }
            }
          });
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
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as ValidateParams;

  if (!typed.request || typeof typed.request !== 'object') {
    return {
      success: false,
      error: { type: 'validation_error', message: "Missing 'request' object" },
    };
  }

  return validateRequest(typed.request, context.enumSpecs);
}

export const validateTool: ToolDefinition = {
  name: 'yf_validate',
  description:
    'Validate an ERP request JSON structure before executing it. ' +
    'Checks required fields (type_key, operation, input), operation validity, ' +
    'and YF-specific structural rules: conditions must be object form (not array), ' +
    'conditions.operator lowercase and/or, page_size <= 10000, and enum fields must ' +
    'receive the plain code (not the response form such as the code followed by a dot). ' +
    'Use this to catch errors before calling yf_run.',
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