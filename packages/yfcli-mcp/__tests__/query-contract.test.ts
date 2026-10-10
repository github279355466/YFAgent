/**
 * yf_query 线上契约测试 —— 锁定 conditions 的**实际发送形态**。
 *
 * 背景（2026-10-10 事故）：
 *   真机探测报告（docs/plans/yf-live-probe-report.md §三）与 SDK 构造器
 *   （packages/yfcli-sdk/src/conditions/builder.ts）一致采用**小写** `and`：
 *   `{ operator: "and", fields: [...] }` 实测 `code=0` + 过滤生效。
 *   而本工具的 handler 曾硬编码大写 `"AND"` 送出，导致服务端条件求值失败、
 *   静默返回未过滤数据（查不存在的单号仍返回真实订单）。
 *
 * 本测试不连网，只断言「交给 client 的 parameter」原样满足协议要求 ——
 * 这是唯一能在无 token 环境下锁死该缺陷的关卡。
 */

import { describe, it, expect } from 'vitest';
import { queryTool } from '../src/tools/query.js';
import { validateTool } from '../src/tools/validate.js';
import type { ToolContext } from '../src/session.js';

interface Captured {
  typeKey: string;
  parameter: Record<string, unknown>;
}

/** 造一个只捕获入参、不发请求的假 client。 */
function captureContext(): { context: ToolContext; captured: Captured[] } {
  const captured: Captured[] = [];
  const context = {
    token: 'test-token',
    catalog: null,
    client: {
      query: async (typeKey: string, parameter: Record<string, unknown>) => {
        captured.push({ typeKey, parameter });
        return { totalResult: 0, hasNext: false, rows: [] };
      },
    },
  } as unknown as ToolContext;
  return { context, captured };
}

describe('yf_query conditions 线上契约', () => {
  it('逻辑操作符必须是小写 and（不得大写 AND）', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [{ field_name: 'doc_no', operator: '=', value: '20240703001' }],
      },
      context,
    );

    const conditions = captured[0]!.parameter['conditions'] as Record<string, unknown>;
    expect(conditions['operator']).toBe('and');
  });

  it('无条件时也送小写 and 的空对象，而非大写', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler({ type_key: 'sales.order' }, context);

    const conditions = captured[0]!.parameter['conditions'] as Record<string, unknown>;
    expect(conditions).toEqual({ operator: 'and', fields: [] });
  });

  it('条件字段原样落到 fields[]，不丢字段', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [
          { field_name: 'doc_date', operator: 'BETWEEN', value: "'20260101' AND '20260331'" },
          { field_name: 'approve_status', operator: '=', value: 'Y' },
        ],
      },
      context,
    );

    const conditions = captured[0]!.parameter['conditions'] as Record<string, unknown>;
    expect(conditions['fields']).toEqual([
      { field_name: 'doc_date', operator: 'BETWEEN', value: "'20260101' AND '20260331'" },
      { field_name: 'approve_status', operator: '=', value: 'Y' },
    ]);
  });

  it('node_name 仅在提供时透传', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [
          { field_name: 'project_code', operator: '=', value: '00181', node_name: 'sales_order_detail_data' },
        ],
      },
      context,
    );

    const conditions = captured[0]!.parameter['conditions'] as Record<string, unknown>;
    expect((conditions['fields'] as unknown[])[0]).toEqual({
      field_name: 'project_code',
      operator: '=',
      value: '00181',
      node_name: 'sales_order_detail_data',
    });
  });

  it('use_has_next 必须随分页一同送出（规则文档曾漏提）', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler({ type_key: 'sales.order', page_no: 2, page_size: 500 }, context);

    expect(captured[0]!.parameter['page_no']).toBe(2);
    expect(captured[0]!.parameter['page_size']).toBe(500);
    expect(captured[0]!.parameter['use_has_next']).toBe(true);
  });
});

describe('yf_query 入参校验（禁止静默降级为全表）', () => {
  it('空 operator 显式报错，不发送请求', async () => {
    const { context, captured } = captureContext();

    const result = (await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [{ field_name: 'doc_no', operator: '', value: '20240703001' }],
      },
      context,
    )) as { error?: string };

    expect(captured).toHaveLength(0);
    expect(result.error).toContain('operator');
  });

  it('空 field_name（非 EXISTS）显式报错，不发送请求', async () => {
    const { context, captured } = captureContext();

    const result = (await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [{ field_name: '', operator: '=', value: '20240703001' }],
      },
      context,
    )) as { error?: string };

    expect(captured).toHaveLength(0);
    expect(result.error).toContain('field_name');
  });

  it('合法的 EXISTS 条件允许 field_name 留空', async () => {
    const { context, captured } = captureContext();

    await queryTool.handler(
      {
        type_key: 'sales.order',
        conditions: [{ field_name: '', operator: 'EXISTS', value: '(SELECT 1)' }],
      },
      context,
    );

    expect(captured).toHaveLength(1);
    const conditions = captured[0]!.parameter['conditions'] as Record<string, unknown>;
    expect((conditions['fields'] as unknown[])[0]).toEqual({
      field_name: '',
      operator: 'EXISTS',
      value: '(SELECT 1)',
    });
  });
});

describe('yf_validate conditions 校验', () => {
  const base = { type_key: 'sales.order', operation: 'query' };

  it('拒绝大写 AND 操作符', async () => {
    const result = (await validateTool.handler(
      { request: { ...base, input: { conditions: { operator: 'AND', fields: [] } } } },
      {} as never,
    )) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('conditions.operator');
  });

  it('接受小写 and 操作符', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: {
            conditions: {
              operator: 'and',
              fields: [{ field_name: 'doc_no', operator: '=', value: '20240703001' }],
            },
          },
        },
      },
      {} as never,
    )) as { success: boolean };

    expect(result.success).toBe(true);
  });

  it('拒绝空的 conditions.fields[].operator', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'doc_no', operator: '' }] } },
        },
      },
      {} as never,
    )) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('fields[0].operator');
  });

  it('拒绝空的 conditions.fields[].field_name（非 EXISTS）', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: '', operator: '=' }] } },
        },
      },
      {} as never,
    )) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('fields[0].field_name');
  });

  it('接受 EXISTS 的空 field_name', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: '', operator: 'EXISTS', value: '(SELECT 1)' }] } },
        },
      },
      {} as never,
    )) as { success: boolean };

    expect(result.success).toBe(true);
  });
});

describe('枚举字典装载（knowledge/enums/enums.yaml → YfEnumFieldSpec）', () => {
  it('loadEnumSpecs 从 enums.yaml 产出 codedText 字段规格', async () => {
    const { loadEnumSpecs } = await import('../src/session.js');
    const specs = await loadEnumSpecs();

    // approve_status 是典型文本型枚举（回参 "Y." / "N." / "U"）
    expect(specs['approve_status']).toBeDefined();
    expect(specs['approve_status']!.codedText).toBe(true);
    expect(specs['approve_status']!.fieldName).toBe('approve_status');

    // flag 是数字型枚举，不应被当作 codedText 处理
    if (specs['flag'] !== undefined) {
      expect(specs['flag']!.codedText).toBe(false);
    }
  });

  it('loadEnumSpecs 结果可被缓存复用（幂等）', async () => {
    const { loadEnumSpecs } = await import('../src/session.js');
    const a = await loadEnumSpecs();
    const b = await loadEnumSpecs();
    expect(a).toBe(b);
  });
});

describe('yf_validate 枚举字段提示（字典感知）', () => {
  const base = { type_key: 'sales.order', operation: 'query' };

  /** 带枚举字典的 context。 */
  function ctxWithEnum(): ToolContext {
    return {
      token: 't',
      catalog: null,
      client: null,
      enumSpecs: {
        approve_status: { fieldName: 'approve_status', codedText: true, codes: new Set(['Y', 'N', 'U', 'V']) },
      },
    } as unknown as ToolContext;
  }

  it('枚举字段传回参形态 "Y." → 报错并给出纯编码建议', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'approve_status', operator: '=', value: 'Y.' }] } },
        },
      },
      ctxWithEnum(),
    )) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('approve_status');
    expect(result.error?.message).toContain('"Y"');
  });

  it('枚举字段传 "Y.已审核" → 报错并建议 "Y"', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'approve_status', operator: '=', value: 'Y.已审核' }] } },
        },
      },
      ctxWithEnum(),
    )) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('"Y"');
  });

  it('枚举字段传合法纯编码 "Y" → 通过', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'approve_status', operator: '=', value: 'Y' }] } },
        },
      },
      ctxWithEnum(),
    )) as { success: boolean };

    expect(result.success).toBe(true);
  });

  it('非枚举字段的带点值（如金额 2.65）→ 不报错', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'order_amount', operator: '>', value: '2.65' }] } },
        },
      },
      ctxWithEnum(),
    )) as { success: boolean };

    expect(result.success).toBe(true);
  });

  it('无 enumSpecs 的 context → 跳过枚举校验，不误报', async () => {
    const result = (await validateTool.handler(
      {
        request: {
          ...base,
          input: { conditions: { operator: 'and', fields: [{ field_name: 'approve_status', operator: '=', value: 'Y.' }] } },
        },
      },
      { token: 't', catalog: null, client: null } as unknown as ToolContext,
    )) as { success: boolean };

    expect(result.success).toBe(true);
  });
});

describe('yf_query total_result 语义（分页哨兵，非总行数）', () => {
  /** 造假 client：totalResult 随 page_size 漂移，模拟真机行为。 */
  function sentinelContext(): ToolContext {
    return {
      token: 'test-token',
      catalog: null,
      client: {
        query: async (_typeKey: string, parameter: Record<string, unknown>) => {
          const ps = Number(parameter['page_size'] ?? 100);
          return { totalResult: ps + 1, hasNext: true, rows: new Array(ps).fill({}) };
        },
      },
    } as unknown as ToolContext;
  }

  it('回传 page_hint，并显式标注它不是总行数', async () => {
    const context = sentinelContext() as unknown as Parameters<typeof queryTool.handler>[1];
    const out = (await queryTool.handler({ type_key: 'sales.order', page_size: 5 }, context)) as Record<string, unknown>;
    // 真机语义：total_result = 本页行数 + 1
    expect(out['page_hint']).toBe(6);
    expect(out['total_result']).toBe(6);
    expect(out['count']).toBe(5);
    expect(out['has_next']).toBe(true);
    // 必须带口径说明，避免 Agent 把它当业务总数
    expect(String(out['total_result_semantics'])).toContain('非总行数');
    expect(String(out['total_result_semantics'])).toContain('has_next');
  });

  it('total_result 随 page_size 漂移 —— 证明它不能当总数用', async () => {
    const context = sentinelContext() as unknown as Parameters<typeof queryTool.handler>[1];
    const at5 = (await queryTool.handler({ type_key: 'sales.order', page_size: 5 }, context)) as Record<string, unknown>;
    const at50 = (await queryTool.handler({ type_key: 'sales.order', page_size: 50 }, context)) as Record<string, unknown>;
    expect(at5['total_result']).not.toBe(at50['total_result']);
    // 但 count 始终等于本页真实行数
    expect(at5['count']).toBe(5);
    expect(at50['count']).toBe(50);
  });

  it('工具 description 必须写明 total_result 陷阱', () => {
    expect(queryTool.description).toContain('total_result');
    expect(queryTool.description).toContain('不是总行数');
  });
});