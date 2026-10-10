/**
 * P0 回归测试（TDD 立红）—— 源码审查 2026-10-09 发现的高危缺陷
 *
 * ℹ️ 回归护栏：本文件记录的缺陷**已修复**，用例现已全部转绿。
 *    保留目的：防止回归。历史上的「红」过程见对应报告。
 *    每条用例的标题即「修复后应满足的期望」。
 *    实现修复后，本文件的 expect 会自然转绿，届时按仓库纪律保留为回归护栏。
 *
 * 对应报告：docs/reviews/2026-10-09-代码审查报告.md
 */
import { describe, it, expect } from "vitest";
import { validateTemplate, defineTemplate, renderSql, type SqlTemplate } from "../src/runtime/sql/template.js";
import { convertPlaceholders } from "../src/runtime/sql/driver.js";

/** 满足既有前置校验的最小模板骨架 */
function base(over: Partial<SqlTemplate>): SqlTemplate {
  return defineTemplate({
    id: "p0_probe",
    label: "probe",
    params: [],
    max_rows: 10,
    timeout_ms: 1000,
    sql: "SELECT TOP (:max_rows) a FROM vw_ai_probe",
    ...over,
  });
}

describe("[P0-1] template.ts 视图白名单可被方括号标识符绕过", () => {
  it("应拒绝 [COPMA] 这类方括号包裹的物理表名", () => {
    const bad = base({ sql: "SELECT TOP (:max_rows) a FROM [COPMA]" });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("应拒绝 [dbo].[COPMA] 多段方括号名", () => {
    const bad = base({ sql: "SELECT TOP (:max_rows) a FROM [dbo].[COPMA]" });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });
});

describe("[P0-2] template.ts 禁用词正则无右边界，误伤合法列名", () => {
  it("updated_at 是合法列名，不应被当作关键字 update 拦截", () => {
    const good = base({ sql: "SELECT TOP (:max_rows) updated_at FROM vw_ai_probe" });
    expect(() => validateTemplate(good)).not.toThrow();
  });

  it("create_date 是易飞管理字段，不应被当作关键字 create 拦截", () => {
    const good = base({ sql: "SELECT TOP (:max_rows) create_date FROM vw_ai_probe" });
    expect(() => validateTemplate(good)).not.toThrow();
  });

  it("exec_summary 是合法列名，不应被当作关键字 exec 拦截", () => {
    const good = base({ sql: "SELECT TOP (:max_rows) exec_summary FROM vw_ai_probe" });
    expect(() => validateTemplate(good)).not.toThrow();
  });
});

describe("[P0-3] template.ts CTE 被误判为物理表（注释声称支持）", () => {
  it("应以 vw_ai_* 为数据源的 CTE 通过校验", () => {
    const good = base({
      sql: "WITH cte AS (SELECT a FROM vw_ai_probe) SELECT TOP (:max_rows) a FROM cte",
    });
    expect(() => validateTemplate(good)).not.toThrow();
  });
});

describe("[P0-4] driver.ts convertPlaceholders 篡改字符串字面量", () => {
  it("不应把字符串字面量内的 :placeholder 当成真占位符改写", () => {
    // 字面量 ':end_date' 应原样保留；当前实现会改写为 '@end_date'
    const out = convertPlaceholders("SELECT a FROM vw_ai_x WHERE s = ':end_date' AND t = :end_date");
    expect(out).toContain("':end_date'");
    expect(out).toContain("@end_date");
  });

  it("不应改写字符串字面量内带 :xxx 形态的文本（SQL 片段场景）", () => {
    const out = convertPlaceholders(
      "SELECT a FROM vw_ai_x WHERE note = 'see :foo doc' AND t = :end_date",
    );
    expect(out).toContain("'see :foo doc'");
  });
});

describe("[P0-5] driver.ts createMssqlDriverFromEnv 绕过凭据红线", () => {
  it("凭据通道应唯一：不得存在接受裸连接串（含明文 Password）的出口", async () => {
    const mod = await import("../src/runtime/sql/driver.js");
    expect(Object.keys(mod)).not.toContain("createMssqlDriverFromEnv");
  });
});

describe("[P0-6] template.ts renderSql 不校验调用方传入的 maxRows", () => {
  it("maxRows=0 应被拒绝（TOP(0) 返回空集，会被误判为『无数据』）", () => {
    const t = base({ max_rows: 1000 });
    expect(() => renderSql(t, {}, 0)).toThrow();
  });

  it("maxRows=负数 应被拒绝", () => {
    const t = base({ max_rows: 1000 });
    expect(() => renderSql(t, {}, -5)).toThrow();
  });
});
