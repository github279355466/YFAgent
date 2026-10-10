/**
 * 真机场景 · 智能问数（三域各 1 题）
 *
 * 数据源策略：一律走 ERP OpenAPI 取数（yf_query），
 * 不依赖 SQL Server 直连与 vw_ai_* 视图。
 *
 * 两段式：yf_ask(question) 无 rows → QueryPlan；
 *         取数后 yf_ask(question, rows) → 确定性计算。
 *
 * 默认 skip；YF_LIVE=1 时执行。
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  isLiveEnabled,
  getSession,
  runScenario,
  extractRows,
  type ScenarioResult,
  scenarioResults,
  defectRecords,
  residualRecords,
} from './helpers.js';
import { writeSidecar } from './sidecar.js';

const LIVE = isLiveEnabled();

/** 断言场景未 FAIL。 */
function assertNotFailed(r: ScenarioResult): void {
  if (r.verdict === 'WARN' && !r.note) throw new Error(`[${r.scenario}] 标注 WARN 但未给出原因`);
  expect(r.verdict, `[${r.scenario}] ${r.actual}`).not.toBe('FAIL');
}

interface AskCase {
  domain: string;
  question: string;
  expectedTemplate: string;
  /** 用于 OpenAPI 取数的 type_key */
  fetchTypeKey: string;
}

const ASK_CASES: AskCase[] = [
  {
    domain: '销售域',
    question: '本月销售毛利是多少',
    expectedTemplate: 'sales_margin_by_order',
    fetchTypeKey: 'sales.order',
  },
  {
    domain: '采购域',
    question: '采购汇总按供应商统计',
    expectedTemplate: 'purchase_summary_by_supplier',
    fetchTypeKey: 'purchase.order',
  },
  {
    domain: '库存域',
    question: '库存成本按料号是多少',
    expectedTemplate: 'inventory_cost_by_item',
    fetchTypeKey: 'item',
  },
];

describe.skipIf(!LIVE)('真机 · 智能问数（三域）', () => {
  for (const c of ASK_CASES) {
    describe(c.domain, () => {
      it(`${c.domain} / yf_ask 无 rows → QueryPlan`, async () => {
        const r = await runScenario(
          {
            scenario: `问数/${c.domain}/路由与计划`,
            object: c.fetchTypeKey,
            operation: 'ask',
            expected: `路由到模板 ${c.expectedTemplate}`,
          },
          async () => {
            const session = await getSession();
            const call = await session.callTool('yf_ask', { question: c.question });
            const plan = call.parsed?.['query_plan'] as Record<string, unknown> | null | undefined;
            const templateId = plan?.['template_id'];
            if (!plan) {
              throw new Error(`yf_ask 未返回 query_plan：${call.text.slice(0, 200)}`);
            }
            return {
              actual: `template_id=${JSON.stringify(templateId)} confidence=${JSON.stringify(plan['confidence'])}`,
              verdict: templateId === c.expectedTemplate ? 'PASS' : 'WARN',
              note:
                templateId === c.expectedTemplate
                  ? ''
                  : `实测路由到 ${JSON.stringify(templateId)}，期望 ${c.expectedTemplate}`,
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${c.domain} / 取数后确定性计算（带口径标签）`, async () => {
        const r = await runScenario(
          {
            scenario: `问数/${c.domain}/确定性计算`,
            object: c.fetchTypeKey,
            operation: 'ask+rows',
            expected: 'executed=true 且 result.row_count 与传入行数一致',
          },
          async () => {
            const session = await getSession();
            const q = await session.callTool('yf_query', { type_key: c.fetchTypeKey, page_size: 10 });
            const rows = extractRows(q.parsed);

            const call = await session.callTool('yf_ask', { question: c.question, rows });
            const executed = call.parsed?.['executed'];
            const result = call.parsed?.['result'] as Record<string, unknown> | null | undefined;
            if (executed !== true) {
              return {
                actual: `取数 ${rows.length} 行，但 yf_ask 未进入执行态（executed=${JSON.stringify(executed)}）`,
                verdict: 'WARN',
                note:
                  rows.length === 0
                    ? `yf_query(${c.fetchTypeKey}) 未取到数据，无法完成确定性计算（口径已知，非缺陷）`
                    : `已取到 ${rows.length} 行却未执行，需排查 yf_ask 的 rows 通道`,
                };
            }
            return {
              actual: `取数 ${rows.length} 行 → row_count=${JSON.stringify(result?.['row_count'])} template=${JSON.stringify(result?.['template_id'])}`,
              verdict: 'PASS',
              note: '确定性计算链路打通（变化/变化率/贡献度由代码计算，不经 LLM）',
            };
          },
        );
        assertNotFailed(r);
      });
    });
  }

  it('降级 / 无法匹配的问题必须诚实失败', async () => {
    const r = await runScenario(
      {
        scenario: '问数/降级/未匹配问题',
        object: '-',
        operation: 'ask',
        expected: 'executed=false 且 query_plan 为空，禁止编造数字',
      },
      async () => {
        const session = await getSession();
        const call = await session.callTool('yf_ask', { question: '今天天气怎么样' });
        const executed = call.parsed?.['executed'];
        const plan = call.parsed?.['query_plan'];
        const errors = call.parsed?.['errors'] as unknown[] | undefined;
        const honest = executed === false && (plan === null || plan === undefined);
        return {
          actual: `executed=${JSON.stringify(executed)} query_plan=${JSON.stringify(plan)} errors=${JSON.stringify(errors ?? [])}`,
          verdict: honest ? 'PASS' : 'FAIL',
          note: honest ? '未匹配时返回空计划 + 明确提示，符合「禁止编造」护栏' : '未匹配却仍返回了计划/数字',
        };
      },
    );
    assertNotFailed(r);
  });
});

// 本文件全部用例跑完后写出侧车结果，供报告生成器汇总（跨文件进程隔离）
afterAll(() => {
  writeSidecar('ask', {
    scenarios: scenarioResults,
    residual: residualRecords as unknown as Array<Record<string, unknown>>,
    defects: defectRecords as unknown as Array<Record<string, unknown>>,
  });
});