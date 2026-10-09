import { describe, it, expect } from "vitest";
import { ExpertRegistry } from "../src/registry.js";
import type { ExpertDefinition, FormulaDefinition, CaliberTag } from "../src/types.js";
import type { TemplateResolver } from "../src/registry.js";

const TEST_CALIBER: CaliberTag = {
  approveFilter: "approve_status='Y'",
  unit: "元",
  precision: 2,
  description: "测试口径",
};

function makeFormula(id: string, templateId: string): FormulaDefinition {
  return {
    id,
    name: `公式 ${id}`,
    sourceTemplateId: templateId,
    caliber: TEST_CALIBER,
    scope: { requiredParams: [], groupBy: [] },
    compute: () => ({ value: 0, caliber: TEST_CALIBER }),
  };
}

function makeExpert(id: string, formulas: FormulaDefinition[]): ExpertDefinition {
  return {
    id,
    name: `专家 ${id}`,
    domain: "test",
    formulas,
  };
}

describe("ExpertRegistry", () => {
  it("注册并获取专家", () => {
    const registry = new ExpertRegistry();
    const expert = makeExpert("test-expert", [makeFormula("f1", "tpl1")]);
    registry.register(expert);

    expect(registry.size).toBe(1);
    expect(registry.getExpert("test-expert")).toBe(expert);
  });

  it("获取不存在的专家返回 undefined", () => {
    const registry = new ExpertRegistry();
    expect(registry.getExpert("nonexistent")).toBeUndefined();
  });

  it("获取指定公式", () => {
    const registry = new ExpertRegistry();
    const f1 = makeFormula("f1", "tpl1");
    const f2 = makeFormula("f2", "tpl2");
    registry.register(makeExpert("e1", [f1, f2]));

    expect(registry.getFormula("e1", "f1")).toBe(f1);
    expect(registry.getFormula("e1", "f2")).toBe(f2);
    expect(registry.getFormula("e1", "f3")).toBeUndefined();
    expect(registry.getFormula("e2", "f1")).toBeUndefined();
  });

  it("列出所有专家", () => {
    const registry = new ExpertRegistry();
    registry.register(makeExpert("e1", []));
    registry.register(makeExpert("e2", []));

    const list = registry.listExperts();
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });

  it("重复注册抛错", () => {
    const registry = new ExpertRegistry();
    registry.register(makeExpert("dup", []));

    expect(() => registry.register(makeExpert("dup", []))).toThrow(/已注册/);
  });

  it("一致性门禁通过（模板存在）", () => {
    const registry = new ExpertRegistry();
    registry.register(makeExpert("e1", [makeFormula("f1", "existing_tpl")]));

    const resolver: TemplateResolver = {
      hasTemplate: (id) => id === "existing_tpl",
    };

    expect(() => registry.assertConsistency(resolver)).not.toThrow();
  });

  it("一致性门禁失败（模板不存在）", () => {
    const registry = new ExpertRegistry();
    registry.register(makeExpert("e1", [makeFormula("f1", "missing_tpl")]));

    const resolver: TemplateResolver = {
      hasTemplate: () => false,
    };

    expect(() => registry.assertConsistency(resolver)).toThrow(/一致性检查失败/);
    expect(() => registry.assertConsistency(resolver)).toThrow(/missing_tpl/);
  });

  it("一致性门禁报告多个偏差", () => {
    const registry = new ExpertRegistry();
    registry.register(makeExpert("e1", [
      makeFormula("f1", "tpl_a"),
      makeFormula("f2", "tpl_b"),
    ]));

    const resolver: TemplateResolver = {
      hasTemplate: () => false,
    };

    try {
      registry.assertConsistency(resolver);
      expect.fail("should throw");
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain("2 个偏差");
      expect(msg).toContain("tpl_a");
      expect(msg).toContain("tpl_b");
    }
  });
});
