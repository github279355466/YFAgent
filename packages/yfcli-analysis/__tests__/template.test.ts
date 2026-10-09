import { describe, it, expect } from "vitest";
import {
  defineTemplate,
  validateTemplate,
  renderSql,
  SqlTemplateRegistry,
} from "../src/runtime/sql/template.js";

const validTemplate = defineTemplate({
  id: "test_view",
  label: "测试视图",
  params: [
    { name: "start_date", type: "string", required: true },
    { name: "approve_status", type: "string", required: false, default: "Y" },
  ],
  sql: `SELECT TOP (:max_rows) col1, col2
FROM vw_ai_test
WHERE doc_date >= :start_date AND approve_status = :approve_status`,
  max_rows: 100,
  timeout_ms: 5000,
});

describe("validateTemplate", () => {
  it("应通过合法模板校验", () => {
    expect(() => validateTemplate(validTemplate)).not.toThrow();
  });

  it("应拒绝非 SELECT/WITH 开头", () => {
    const bad = defineTemplate({ ...validTemplate, sql: "DELETE FROM vw_ai_test" });
    expect(() => validateTemplate(bad)).toThrow(/必须以 SELECT 或 WITH 开头/);
  });

  it("应拒绝含危险关键字", () => {
    const bad = defineTemplate({
      ...validTemplate,
      sql: "SELECT TOP (:max_rows) * FROM vw_ai_test; DROP TABLE foo",
    });
    expect(() => validateTemplate(bad)).toThrow(/含非只读关键字/);
  });

  it("应拒绝缺少 :max_rows", () => {
    const bad = defineTemplate({
      ...validTemplate,
      sql: "SELECT col1 FROM vw_ai_test WHERE col2 = :start_date",
    });
    expect(() => validateTemplate(bad)).toThrow(/必须使用 :max_rows/);
  });

  it("应拒绝引用非 vw_ai_* 表（白名单门禁）", () => {
    const bad = defineTemplate({
      ...validTemplate,
      sql: "SELECT TOP (:max_rows) * FROM COPMA WHERE col = :start_date",
    });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("应拒绝 JOIN 非 vw_ai_* 表", () => {
    const bad = defineTemplate({
      ...validTemplate,
      sql: `SELECT TOP (:max_rows) a.col FROM vw_ai_sales_margin a
            JOIN INVMB b ON b.MB001 = a.product_no`,
    });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("应允许 dbo.vw_ai_* 带 schema 前缀", () => {
    const good = defineTemplate({
      ...validTemplate,
      sql: "SELECT TOP (:max_rows) * FROM dbo.vw_ai_test WHERE col = :start_date",
    });
    expect(() => validateTemplate(good)).not.toThrow();
  });
});

describe("SqlTemplateRegistry", () => {
  it("注册/获取/列表", () => {
    const reg = new SqlTemplateRegistry();
    reg.register(validTemplate);
    expect(reg.get("test_view")).toBe(validTemplate);
    expect(reg.list()).toHaveLength(1);
    expect(reg.size).toBe(1);
  });

  it("注册非法模板应抛错", () => {
    const reg = new SqlTemplateRegistry();
    const bad = defineTemplate({
      ...validTemplate,
      sql: "INSERT INTO vw_ai_test VALUES (1)",
    });
    expect(() => reg.register(bad)).toThrow();
    expect(reg.size).toBe(0);
  });
});

describe("renderSql", () => {
  it("应正确填充参数和默认值", () => {
    const result = renderSql(validTemplate, { start_date: "20260101" });
    expect(result.values["start_date"]).toBe("20260101");
    expect(result.values["approve_status"]).toBe("Y");
    expect(result.values["max_rows"]).toBe(100);
  });

  it("应拒绝缺失必填参数", () => {
    expect(() => renderSql(validTemplate, {})).toThrow(/缺少必填参数.*start_date/);
  });

  it("应拒绝未声明参数", () => {
    expect(() =>
      renderSql(validTemplate, { start_date: "20260101", evil: "hack" }),
    ).toThrow(/未声明参数.*evil/);
  });

  it("行数上限不可突破模板上限", () => {
    const result = renderSql(validTemplate, { start_date: "20260101" }, 9999);
    expect(result.max_rows).toBe(100);
  });
});
