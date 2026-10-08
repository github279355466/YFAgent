/**
 * 条件构造器 —— 只产出易飞**对象形态**。
 *
 * 实测依据（docs/plans/yf-live-probe-report.md §三）：
 * | 写法 | 真机结果 |
 * |---|---|
 * | `{operator, fields[]}` | code=0，过滤生效 |
 * | `[{groups:[...]}]`（易助写法） | code=-1，conditions not found. |
 * | `[{field,op,value}]`（扁平数组） | code=-1，conditions not found. |
 * | `{}`（空对象） | code=0，取全部资料 |
 *
 * OPEN-A3裁定：不做双向兼容层。本模块只提供易飞形态构造器，
 * 并对数组形态做**显式拒绝**（见 assertNotYiZhuConditionsShape），给出可理解的报错。
 */

import type {
  YfConditionField,
  YfConditionGroup,
  YfConditions,
  YfFieldOperator,
  YfLogicalOperator,
  YfOrder,
  YfPagination,
  YfQueryParameter,
} from '../types/conditions.js';
import { YF_PAGE_NO_MIN, YF_PAGE_SIZE_MAX } from '../types/protocol.js';

/** 「取全部资料」的条件 —— 空对象，不是空数组。 */
export function allRecords(): YfConditions {
  return { operator: 'and', fields: [] };
}

/** 构造单个条件字段。`nodeName` 仅在查单身字段时需要。 */
export function field(
  fieldName: string,
  operator: YfFieldOperator,
  value: string,
  nodeName?: string,
): YfConditionField {
  if (operator === 'EXISTS' || operator === 'NOT EXISTS') {
    // EXISTS / NOT EXISTS 的 field_name 必须留空（文档 §3.2 明确要求）。
    if (fieldName !== '') {
      throw new TypeError(
        `${operator} 的 field_name 必须留空，收到 ${fieldName}。` +
          '这是易飞协议硬约束，传字段名会报 conditions not found.',
      );
    }
  }
  if (fieldName === '' && operator !== 'EXISTS' && operator !== 'NOT EXISTS') {
    throw new TypeError(
      `运算符 ${operator} 必须指定 field_name。` +
        '仅 EXISTS / NOT EXISTS 允许留空。',
    );
  }

  return nodeName === undefined
    ? { field_name: fieldName, operator, value }
    : { field_name: fieldName, operator, value, node_name: nodeName };
}

/**
 * 构造复合字段条件：`doc_type_no+doc_no`。
 *
 * 易飞用 `+` 拼接而非嵌套 group，用于单字段整体相等判断。
 */
export function compositeField(
  fieldNames: readonly string[],
  operator: YfFieldOperator,
  value: string,
  nodeName?: string,
): YfConditionField {
  if (fieldNames.length === 0) {
    throw new TypeError('compositeField 至少需要一个字段名');
  }
  return field(fieldNames.join('+'), operator, value, nodeName);
}

/** 构造条件组。`fields` 可混放条件字段与嵌套条件组。 */
export function group(
  operator: YfLogicalOperator,
  fields: readonly (YfConditionField | YfConditionGroup)[],
): YfConditionGroup {
  return { operator, fields };
}

/** 条件组内AND 组合（最常用形态）。 */
export function allOf(fields: readonly (YfConditionField | YfConditionGroup)[]): YfConditionGroup {
  return group('and', fields);
}

/** 条件组内 OR 组合。 */
export function anyOf(fields: readonly (YfConditionField | YfConditionGroup)[]): YfConditionGroup {
  return group('or', fields);
}

/**
 * BETWEEN 条件。
 *
 * 易飞的 value 必须是 `'<起>' AND '<止>'` 形态（带 SQL 引号片段），
 * 不接受数组或对象 —— 这是易飞特有高危点。
 */
export function between(
  fieldName: string,
  from: string,
  to: string,
  nodeName?: string,
): YfConditionField {
  if (from === '' || to === '') {
    throw new TypeError('BETWEEN 的起止值均不得为空字符串（易飞对空串返回 0 条且不报错）');
  }
  return field(fieldName, 'BETWEEN', `'${from}' AND '${to}'`, nodeName);
}

/**
 * IN 条件。
 *
 * 易飞 value 必须是 `(N'000',N'001')` 形态：外层括号 + 每项单引号。
 * 空列表会退化为查不到数据，故此处直接拒绝。
 */
export function inList(
  fieldName: string,
  values: readonly string[],
  nodeName?: string,
): YfConditionField {
  if (values.length === 0) {
    throw new TypeError(
      'IN 列表不得为空。易飞对空 IN 返回 code=0 + 0 条（静默错误），请改用 allRecords() 取全量',
    );
  }
  const rendered = values.map((v) => `'${v}'`).join(',');
  return field(fieldName, 'IN', `(${rendered})`, nodeName);
}

/** NOT IN 条件，格式同 {@link inList}。 */
export function notInList(
  fieldName: string,
  values: readonly string[],
  nodeName?: string,
): YfConditionField {
  if (values.length === 0) {
    throw new TypeError('NOT IN 列表不得为空（易飞对空 NOT IN 返回 0 条且不报错）');
  }
  const rendered = values.map((v) => `'${v}'`).join(',');
  return field(fieldName, 'NOT IN', `(${rendered})`, nodeName);
}

/** LIKE 条件，通配符写在 value 内（如 `00%` / `%00%`）。 */
export function like(fieldName: string, pattern: string, nodeName?: string): YfConditionField {
  if (pattern === '') {
    throw new TypeError('LIKE 的匹配模式不得为空串（空串在易飞返回 0 条且 code=0）');
  }
  return field(fieldName, 'LIKE', pattern, nodeName);
}

/** EXISTS 子查询条件。`field_name` 恒为空串。 */
export function exists(subQuery: string): YfConditionField {
  return field('', 'EXISTS', subQuery);
}

/** NOT EXISTS 子查询条件。 */
export function notExists(subQuery: string): YfConditionField {
  return field('', 'NOT EXISTS', subQuery);
}

/**
 * 分页参数 —— 带上限夹紧。
 *
 * `page_size` 上限 10000（真机验证 10000 可用，无报错）。
 * 易飞**无 fastquery**（易助有），每次查询重查数据库，
 * 因此大 page_size 不是「更快」，而是「单次更慢且更难中断」。
 */
export function pagination(
  pageNo: number,
  pageSize: number,
  useHasNext = true,
): YfPagination {
  if (!Number.isInteger(pageNo) || pageNo < YF_PAGE_NO_MIN) {
    throw new TypeError(
      `page_no 必须是不小于 ${YF_PAGE_NO_MIN} 的整数（易飞页码从 1 开始），收到 ${pageNo}`,
    );
  }
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new TypeError(`page_size 必须是正整数，收到 ${pageSize}`);
  }
  if (pageSize > YF_PAGE_SIZE_MAX) {
    throw new TypeError(
      `page_size 不得超过 ${YF_PAGE_SIZE_MAX}（易飞硬上限），收到 ${pageSize}`,
    );
  }
  return { page_no: pageNo, page_size: pageSize, use_has_next: useHasNext };
}

/**
 * 组装查询入参。
 *
 * `selectedColumns` 为 20260401 新增的入参级回参裁剪，真机验证生效。
 * 传undefined 时不写入该键（而非传空串），避免老服务端把空串当作非法列名。
 */
export function queryParameter(input: {
  readonly conditions: YfConditions;
  readonly page: YfPagination;
  readonly orders?: readonly YfOrder[];
  readonly selectedColumns?: readonly string[];
}): YfQueryParameter {
  const base = { ...input.page, conditions: input.conditions };
  if (input.orders !== undefined) {
    return { ...base, orders: input.orders };
  }
  if (input.selectedColumns !== undefined) {
    return { ...base, selectedColumns: input.selectedColumns.join(',') };
  }
  return base;
}

/** 升序排序项。 */
export function asc(fieldName: string): YfOrder {
  return { field_name: fieldName, order_type: 'asc' };
}

/** 降序排序项。 */
export function desc(fieldName: string): YfOrder {
  return { field_name: fieldName, order_type: 'desc' };
}

/**
 * 显式拒绝易助数组形态。
 *
 * 存在的意义：易助代码习惯性会用 `[{ groups: [...] }]`，
 * 在易飞侧得到 `conditions not found.`。与其让用户去猜，
 * 不如在构造阶段就抛出指向明确的错误。
 */
export function assertNotYiZhuConditionsShape(candidate: unknown): void {
  if (Array.isArray(candidate)) {
    const hasGroups = candidate.some(
      (item) => typeof item === 'object' && item !== null && 'groups' in item,
    );
    throw new TypeError(
      hasGroups
        ? '检测到易助形态的 conditions（数组 + groups）。易飞必须是对象形态 {operator, fields[]}，' +
          '数组形态会返回 code=-1 conditions not found.。请改用 group() / allOf() 构造。'
        : '检测到扁平数组形态的 conditions。易飞必须是对象形态 {operator, fields[]}，' +
          '数组形态会返回 code=-1 conditions not found.。请改用 allOf() 构造。',
    );
  }
}