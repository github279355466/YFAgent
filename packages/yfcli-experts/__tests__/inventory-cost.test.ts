import { describe, it, expect } from "vitest";
import { PERIOD_END_COST_FORMULA } from "../src/experts/inventory-cost/formulas.js";
import { INVENTORY_COST_CALIBER } from "../src/experts/inventory-cost/caliber.js";
import { ExpertError } from "../src/errors.js";
import type { FormulaInputRow } from "../src/types.js";

/** 构造一行 INVLC 风格的输入数据 */
function makeRow(overrides: Record<string, number | null> = {}): FormulaInputRow {
  return {
    opening_cost: overrides["opening_cost"] ?? 1000,
    inbound_cost: overrides["inbound_cost"] ?? 500,
    outbound_cost: overrides["outbound_cost"] ?? 300,
    adjust_in_cost: overrides["adjust_in_cost"] ?? 50,
    adjust_out_cost: overrides["adjust_out_cost"] ?? 20,
  };
}

describe("库存成本专家 - 期末成本公式", () => {
  const formula = PERIOD_END_COST_FORMULA;

  it("元数据完整", () => {
    expect(formula.id).toBe("period_end_cost");
    expect(formula.sourceTemplateId).toBe("period_end_cost_by_item");
    expect(formula.caliber.approveFilter).toBe("approve_status='Y'");
    expect(formula.caliber.unit).toBe("元");
    expect(formula.caliber.precision).toBe(2);
    expect(formula.scope.requiredParams).toContain("year_month");
    expect(formula.scope.groupBy).toContain("item_no");
  });

  it("正常计算（有数据）", () => {
    // 期末 = 1000 + 500 - 300 + 50 - 20 = 1230
    const result = formula.compute([makeRow()]);

    expect(result.value).toBe(1230);
    expect(result.caliber).toBe(INVENTORY_COST_CALIBER);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown!["opening_cost"]).toBe(1000);
    expect(result.breakdown!["inbound_cost"]).toBe(500);
    expect(result.breakdown!["outbound_cost"]).toBe(300);
    expect(result.breakdown!["adjust_in_cost"]).toBe(50);
    expect(result.breakdown!["adjust_out_cost"]).toBe(20);
  });

  it("空集 → 返回 0 + 口径标签", () => {
    const result = formula.compute([]);

    expect(result.value).toBe(0);
    expect(result.caliber).toBe(INVENTORY_COST_CALIBER);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown!["opening_cost"]).toBe(0);
  });

  it("零值 → 返回 0", () => {
    const row = makeRow({
      opening_cost: 0,
      inbound_cost: 0,
      outbound_cost: 0,
      adjust_in_cost: 0,
      adjust_out_cost: 0,
    });
    const result = formula.compute([row]);

    expect(result.value).toBe(0);
  });

  it("负值 → 正常计算", () => {
    // 退货/冲销场景：入库为负
    // 期末 = 1000 + (-200) - 300 + 50 - 20 = 530
    const row = makeRow({ inbound_cost: -200 });
    const result = formula.compute([row]);

    expect(result.value).toBe(530);
  });

  it("跨期 → 正确累加多行", () => {
    // 两行数据模拟两个品号或两个月档
    // 行1: 1000 + 500 - 300 + 50 - 20 = 1230
    // 行2: 2000 + 800 - 600 + 100 - 40 = 2260
    // 合计: 3490
    const rows = [
      makeRow(),
      makeRow({
        opening_cost: 2000,
        inbound_cost: 800,
        outbound_cost: 600,
        adjust_in_cost: 100,
        adjust_out_cost: 40,
      }),
    ];
    const result = formula.compute(rows);

    expect(result.value).toBe(3490);
    expect(result.breakdown!["opening_cost"]).toBe(3000);
    expect(result.breakdown!["inbound_cost"]).toBe(1300);
  });

  it("缺少必要字段 → 抛 ExpertError", () => {
    const badRow: FormulaInputRow = {
      opening_cost: "not-a-number",
      inbound_cost: 500,
      outbound_cost: 300,
      adjust_in_cost: 50,
      adjust_out_cost: 20,
    };

    expect(() => formula.compute([badRow])).toThrow(ExpertError);
    try {
      formula.compute([badRow]);
    } catch (err) {
      const expertErr = err as ExpertError;
      expect(expertErr.formulaId).toBe("period_end_cost");
      expect(expertErr.caliberDescription).toContain("已审核");
    }
  });

  it("null 字段视为 0", () => {
    const row: FormulaInputRow = {
      opening_cost: null,
      inbound_cost: 500,
      outbound_cost: 300,
      adjust_in_cost: null,
      adjust_out_cost: 20,
    };
    // 期末 = 0 + 500 - 300 + 0 - 20 = 180
    const result = formula.compute([row]);

    expect(result.value).toBe(180);
  });

  it("★ 手工复核：3 笔数据逐笔对账", () => {
    // 手工复核：用真实业务逻辑验证公式正确性
    // （（第1笔）期初=10000，本期出入库如下：
    //   入库金额=3500.50，出库金额=2800.70，调整入=150.25，调整出=88.45
    //   期末 = 10000 + 3500.50 - 2800.70 + 150.25 - 88.45 = 10761.60
    const row1 = makeRow({
      opening_cost: 10000,
      inbound_cost: 3500.50,
      outbound_cost: 2800.70,
      adjust_in_cost: 150.25,
      adjust_out_cost: 88.45,
    });

    // 第2笔：期初=5000，纯消耗（无调整）
    //   期末 = 5000 + 1200 - 3600 = 2600
    const row2 = makeRow({
      opening_cost: 5000,
      inbound_cost: 1200,
      outbound_cost: 3600,
      adjust_in_cost: 0,
      adjust_out_cost: 0,
    });

    // 第3笔：期初=0（新设仓库），全部为新增
    //   期末 = 0 + 8500 - 0 + 120.55 - 0 = 8620.55
    const row3 = makeRow({
      opening_cost: 0,
      inbound_cost: 8500,
      outbound_cost: 0,
      adjust_in_cost: 120.55,
      adjust_out_cost: 0,
    });

    // 三笔合计
    //   10761.60 + 2600 + 8620.55 = 21382.15
    const result = formula.compute([row1, row2, row3]);

    expect(result.value).toBe(21982.15);
    // breakdown 汇总验证
    expect(result.breakdown!["opening_cost"]).toBe(15000);     // 10000+5000+0
    expect(result.breakdown!["inbound_cost"]).toBe(13200.50);   // 3500.50+1200+8500
    expect(result.breakdown!["outbound_cost"]).toBe(6400.70);   // 2800.70+3600+0
    expect(result.breakdown!["adjust_in_cost"]).toBe(270.80);   // 150.25+0+120.55
    expect(result.breakdown!["adjust_out_cost"]).toBe(88.45);
  });

  it("精度控制：超过2位小数自动四舍五入", () => {
    // 构造一个会产生多位小数的场景
    const row = makeRow({
      opening_cost: 100.005,
      inbound_cost: 50.005,
      outbound_cost: 30.005,
      adjust_in_cost: 10.005,
      adjust_out_cost: 5.005,
    });
    // 原始: 100.005 + 50.005 - 30.005 + 10.005 - 5.005 = 125.005
    // roundTo(125.005, 2) = 125.01
    const result = formula.compute([row]);

    expect(result.value).toBe(125.01);
  });
});

