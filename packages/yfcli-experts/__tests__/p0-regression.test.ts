/**
 * P0 回归测试（TDD 立红）—— 源码审查 2026-10-09
 *
 * ℹ️ 回归护栏：本文件记录的缺陷**已修复**，用例现已全部转绿。
 *    保留目的：防止回归。
 *    对应报告：docs/reviews/2026-10-09-代码审查报告.md
 */
import { describe, it, expect } from "vitest";
import { PERIOD_END_COST_FORMULA } from "../src/experts/inventory-cost/formulas.js";
import { ExpertError } from "../src/errors.js";
import type { FormulaInputRow } from "../src/types.js";

function makeRow(overrides: Record<string, number | null> = {}): FormulaInputRow {
  return {
    opening_cost: overrides["opening_cost"] ?? 1000,
    inbound_cost: overrides["inbound_cost"] ?? 500,
    outbound_cost: overrides["outbound_cost"] ?? 300,
    adjust_in_cost: overrides["adjust_in_cost"] ?? 50,
    adjust_out_cost: overrides["adjust_out_cost"] ?? 20,
  };
}

describe("[P0-9] 手工复核基准（复核实证：此项非缺陷，保留为口径护栏）", () => {
  it("注释算式与断言自洽（10761.60 + 2600 + 8620.55 = 21982.15）", () => {
    // 复核实证结论：原报告称「注释 21382.15 vs 断言 21982.15 差 600 元」为误判。
    // 实测 10761.60 + 2600 + 8620.55 = 21982.15，注释、实现、断言三者一致。
    // 本用例保留为口径护栏，防止后续注释被改错。
    const documentedSum = 10761.6 + 2600 + 8620.55;
    expect(Math.round(documentedSum * 100) / 100).toBe(21982.15);
  });

  it("逐笔全精度累加应等于 21982.15（实现正确性固化）", () => {
    const rows = [
      { opening_cost: 10000, inbound_cost: 3500.5, outbound_cost: 2800.7, adjust_in_cost: 150.25, adjust_out_cost: 88.45 },
      { opening_cost: 5000, inbound_cost: 1200, outbound_cost: 3600, adjust_in_cost: 0, adjust_out_cost: 0 },
      { opening_cost: 0, inbound_cost: 8500, outbound_cost: 0, adjust_in_cost: 120.55, adjust_out_cost: 0 },
    ] as unknown as import("../src/types.js").FormulaInputRow[];
    expect(PERIOD_END_COST_FORMULA.compute(rows).value).toBe(21982.15);
  });
});

describe("[P0-10] 空结果集不得静默返回 0（违背 types.ts 明示契约）", () => {
  it("compute([]) 应抛 ExpertError 或显式标记 empty，而非返回 value=0", () => {
    let thrown: unknown = null;
    let value: unknown = null;
    try {
      value = PERIOD_END_COST_FORMULA.compute([]).value;
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(ExpertError);
    expect(value).toBeNull();
  });
});

describe("[P0-11] 字段改名导致静默归零（比抛错更危险）", () => {
  it("行内缺少全部具名字段时应抛 ExpertError，而非得出 0", () => {
    const renamed: FormulaInputRow = {
      opening_amount: 1000,
      inbound_amount: 500,
      outbound_amount: 300,
      adjust_in_amount: 50,
      adjust_out_amount: 20,
    };
    expect(() => PERIOD_END_COST_FORMULA.compute([renamed])).toThrow(ExpertError);
  });
});

describe("[P0-12] scope.groupBy 必须与实现一致（经显式 computeGrouped API）", () => {
  it("computeGrouped 按 item_no 分组，跨品号不得合并为单一总额", () => {
    const rows: FormulaInputRow[] = [
      { item_no: "A1", opening_cost: 1000, inbound_cost: 0, outbound_cost: 0, adjust_in_cost: 0, adjust_out_cost: 0 },
      { item_no: "A2", opening_cost: 5000, inbound_cost: 0, outbound_cost: 0, adjust_in_cost: 0, adjust_out_cost: 0 },
    ];
    const grouped = PERIOD_END_COST_FORMULA.computeGrouped!(rows);

    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["A1", "A2"]));
    expect(grouped["A1"]?.value).toBe(1000);
    expect(grouped["A2"]?.value).toBe(5000);
  });

  it("compute 的返回类型不随输入变化：固定为单个 FormulaResult", () => {
    const rows: FormulaInputRow[] = [
      { item_no: "A1", opening_cost: 1000, inbound_cost: 0, outbound_cost: 0, adjust_in_cost: 0, adjust_out_cost: 0 },
      { item_no: "A2", opening_cost: 5000, inbound_cost: 0, outbound_cost: 0, adjust_in_cost: 0, adjust_out_cost: 0 },
    ];
    const result = PERIOD_END_COST_FORMULA.compute(rows);
    // 必须是「一个结果」，不得变成「结果字典」
    expect(typeof result.value).toBe("number");
    expect(result.value).toBe(6000);
    expect(result.caliber).toBeDefined();
  });

  it("computeGrouped 在 groupBy 字段缺失时必须报错，不得静默并成一组", () => {
    const rows: FormulaInputRow[] = [
      { opening_cost: 100, inbound_cost: 0, outbound_cost: 0, adjust_in_cost: 0, adjust_out_cost: 0 },
    ];
    expect(() => PERIOD_END_COST_FORMULA.computeGrouped!(rows)).toThrow(ExpertError);
  });

  it("computeGrouped 空集必须报错，不得静默返回空对象", () => {
    expect(() => PERIOD_END_COST_FORMULA.computeGrouped!([])).toThrow(ExpertError);
  });
});
describe("[P0-13] toNumber 不得把空串/布尔静默转为数字", () => {
  it("空字符串应被拒绝，而非静默当作 0", () => {
    const row: FormulaInputRow = {
      opening_cost: "", inbound_cost: 500, outbound_cost: 300,
      adjust_in_cost: 50, adjust_out_cost: 20,
    };
    expect(() => PERIOD_END_COST_FORMULA.compute([row])).toThrow(ExpertError);
  });

  it("布尔值应被拒绝，而非静默当作 1/0", () => {
    const row: FormulaInputRow = {
      opening_cost: true, inbound_cost: 500, outbound_cost: 300,
      adjust_in_cost: 50, adjust_out_cost: 20,
    };
    expect(() => PERIOD_END_COST_FORMULA.compute([row])).toThrow(ExpertError);
  });
});
