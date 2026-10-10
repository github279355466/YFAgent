/**
 * 真机场景 · 归因分析（销售 + 生产各 1 题）
 *
 * 流程：yf_analysis_plan(create) → yf_analysis_step(无 rows 取 QueryPlan)
 *       → yf_query 取数 → yf_analysis_step(有 rows 确定性计算)
 *
 * ⚠️ 生产域数据源口径说明（写入报告，不作为缺陷）：
 *    production_cost_by_workorder 为**工单入库批次级**，material_cost 取自 INVLA 出库成本材料部分，
 *    不含独立领料明细。
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

interface AttributionCase {
  domain: string;
  question: string;
  fetchTypeKey: string;
  caliberNote: string;
}

const CASES: AttributionCase[] = [
  {
    domain: '销售域',
    question: '本月销售毛利下降的原因是什么',
    fetchTypeKey: 'sales.order',
    caliberNote: '口径：销货收入 − 销货成本（vw_ai_sales_margin 等效），审核码默认 Y',
  },
  {
    domain: '生产域',
    question: '工单材料成本异常的原因是什么',
    fetchTypeKey: 'wo',
    caliberNote:
      '口径限制：production_cost_by_workorder 为工单入库批次级，material_cost 取自 INVLA 出库成本材料部分，不含独立领料明细',
  },
];

describe.skipIf(!LIVE)('真机 · 归因分析', () => {
  for (const c of CASES) {
    describe(c.domain, () => {
      let planJson: string | undefined;

      it(`${c.domain} / analysis_plan create`, async () => {
        const r = await runScenario(
          {
            scenario: `归因/${c.domain}/建计划`,
            object: c.fetchTypeKey,
            operation: 'analysis_plan',
            expected: 'success=true 且返回 plan',
          },
          async () => {
            const session = await getSession();
            const call = await session.callTool('yf_analysis_plan', {
              action: 'create',
              question: c.question,
            });
            const success = call.parsed?.['success'];
            const plan = call.parsed?.['plan'];
            if (success !== true || !plan) {
              throw new Error(`建计划失败：${call.text.slice(0, 250)}`);
            }
            planJson = JSON.stringify(plan);
            return {
              actual: `plan=${JSON.stringify(plan).slice(0, 200)}`,
              verdict: 'PASS',
              note: c.caliberNote,
            };
          },
        );
        assertNotFailed(r);
      });

      it(`${c.domain} / analysis_step 无 rows → QueryPlan`, async () => {
        const r = await runScenario(
          {
            scenario: `归因/${c.domain}/取QueryPlan`,
            object: c.fetchTypeKey,
            operation: 'analysis_step',
            expected: 'executed=false 且返回 query_plan',
          },
          async () => {
            const session = await getSession();
            if (!planJson) {
              return { actual: '跳过（无 plan）', verdict: 'WARN', note: '建计划场景未成功' };
            }
            const call = await session.callTool('yf_analysis_step', {
              plan_json: planJson,
              operation_json: JSON.stringify({ op: 'CONTRIBUTION', dimensions: ['customer'] }),
            });
            const executed = call.parsed?.['executed'];
            const qp = call.parsed?.['query_plan'];
            if (executed !== false || !qp) {
              throw new Error(`未返回 QueryPlan：${call.text.slice(0, 250)}`);
            }
            return { actual: 'executed=false，query_plan 已返回', verdict: 'PASS', note: '' };
          },
        );
        assertNotFailed(r);
      });

      it(`${c.domain} / 取数后确定性计算`, async () => {
        const r = await runScenario(
          {
            scenario: `归因/${c.domain}/确定性计算`,
            object: c.fetchTypeKey,
            operation: 'analysis_step+rows',
            expected: 'executed=true 且返回 result',
          },
          async () => {
            const session = await getSession();
            if (!planJson) {
              return { actual: '跳过（无 plan）', verdict: 'WARN', note: '建计划场景未成功' };
            }
            const q = await session.callTool('yf_query', { type_key: c.fetchTypeKey, page_size: 10 });
            const rows = extractRows(q.parsed);

            const call = await session.callTool('yf_analysis_step', {
              plan_json: planJson,
              operation_json: JSON.stringify({ op: 'CONTRIBUTION', dimensions: ['customer'] }),
              rows_json: JSON.stringify(rows),
            });
            const executed = call.parsed?.['executed'];
            const result = call.parsed?.['result'] as Record<string, unknown> | null | undefined;
            if (executed !== true) {
              throw new Error(`未进入执行态：${call.text.slice(0, 250)}`);
            }
            return {
              actual: `取数 ${rows.length} 行 → row_count=${JSON.stringify(result?.['row_count'])}`,
              verdict: 'PASS',
              note: c.caliberNote,
            };
          },
        );
        assertNotFailed(r);
      });
    });
  }
});

// 本文件全部用例跑完后写出侧车结果，供报告生成器汇总（跨文件进程隔离）
afterAll(() => {
  writeSidecar('attribution', {
    scenarios: scenarioResults,
    residual: residualRecords as unknown as Array<Record<string, unknown>>,
    defects: defectRecords as unknown as Array<Record<string, unknown>>,
  });
});