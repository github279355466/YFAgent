/**
 * P0 回归测试（第二轮复审，2026-10-09 深夜）—— 第一轮修复后仍存在的缺陷
 *
 * ⚠️ 本文件刻意保持「红」：只固化缺陷现象，不修实现。
 *    每条用例标题即「修复后应满足的期望」。
 *
 * 对应报告：docs/reviews/2026-10-09-代码复审报告-第二轮.md
 *   §1 P0-A（编译阻断）、P0-B（白名单仍可绕过）、P0-D（CI 门禁 FAIL）
 *   §2 P1-A（maxRows 未验整数）、P1-C（注释与状态矛盾）
 *
 * 与第一轮 p0-regression.test.ts 的区别：
 *   第一轮只 import 模块文件本身，因此漏掉了「公共入口 index.ts」这一真实消费路径。
 *   本文件刻意从包入口出发断言，以防同类遗漏。
 */
import { describe, it, expect } from "vitest";
import { validateTemplate, defineTemplate, renderSql, type SqlTemplate } from "../src/runtime/sql/template.js";

/** 满足既有前置校验的最小模板骨架 */
function base(over: Partial<SqlTemplate>): SqlTemplate {
  return defineTemplate({
    id: "p0b_probe",
    label: "probe",
    params: [],
    max_rows: 10,
    timeout_ms: 1000,
    sql: "SELECT TOP (:max_rows) a FROM vw_ai_probe",
    ...over,
  });
}

describe("[P0-A] 包入口 index.ts 必须可编译消费（createMssqlDriverFromEnv 删除后的悬空导出）", () => {
  it("应能从包入口 index.ts 导入全部导出符号（悬空 re-export 会在此暴露）", async () => {
    // 直接动态 import 公共入口。若 index.ts 仍 re-export 已删除的符号，
    // Vite 转译期即失败 —— 与 `tsc --noEmit` 的 TS2305 同源。
    const entry = await import("../src/index.js");
    expect(entry).toBeDefined();
    // 入口导出的驱动面必须自洽：要么有该工厂，要么没有，但不得声明后不存在
    expect(Object.keys(entry)).toContain("MssqlDriver");
    expect(Object.keys(entry)).toContain("convertPlaceholders");
  });

  it("index.ts 源文件不得 re-export 不存在的符号（静态文本护栏）", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
    const driverSrc = await readFile(new URL("../src/runtime/sql/driver.ts", import.meta.url), "utf8");
    const hasFactory = /export\s+(?:function|const)\s+createMssqlDriverFromEnv/.test(driverSrc);
    if (!hasFactory) {
      expect(src).not.toMatch(/createMssqlDriverFromEnv/);
    }
  });
});

describe("[P0-B] 视图白名单必须 fail-closed：未识别的表引用形态一律拒绝", () => {
  it("逗号连接的物理表应被拒绝：FROM vw_ai_x, [COPMA]", () => {
    const bad = base({ sql: "SELECT TOP (:max_rows) a FROM vw_ai_probe, [COPMA]" });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("逗号连接的裸物理表应被拒绝：FROM vw_ai_x, dbo.COPMA", () => {
    const bad = base({ sql: "SELECT TOP (:max_rows) a FROM vw_ai_probe, dbo.COPMA" });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("双引号标识符的物理表应被拒绝：FROM \"COPMA\"", () => {
    const bad = base({ sql: 'SELECT TOP (:max_rows) a FROM "COPMA"' });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("嵌套方括号的物理表应被拒绝：FROM [[COPMA]]", () => {
    const bad = base({ sql: "SELECT TOP (:max_rows) a FROM [[COPMA]]" });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });

  it("子查询内的非法表引用应被拒绝", () => {
    const bad = base({
      sql: "SELECT TOP (:max_rows) a FROM vw_ai_probe WHERE a IN (SELECT a FROM dbo.COPMA)",
    });
    expect(() => validateTemplate(bad)).toThrow(/非 vw_ai_/);
  });
});

describe("[P1-A] renderSql 的 requestedMaxRows 必须是正整数（文案承诺「正整数」）", () => {
  it("小数应被拒绝（1.5 会以小数进入 TOP()）", () => {
    const t = base({ max_rows: 1000 });
    expect(() => renderSql(t, {}, 1.5)).toThrow();
  });

  it("Infinity 应被拒绝（当前靠 Math.min 兜底，属偶然正确）", () => {
    const t = base({ max_rows: 1000 });
    expect(() => renderSql(t, {}, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("[P0-C] 凭据通道唯一：MssqlDriver 不接受明文连接串/密码", () => {
  it("构造参数含 connectionString 应被拒绝", async () => {
    const { MssqlDriver } = await import("../src/runtime/sql/driver.js");
    expect(
      () =>
        new MssqlDriver({
          // @ts-expect-error 刻意传入非法形状：验证运行时兜底
          connectionString: "Server=x;User Id=sa;Password=PLAIN",
        } as never),
    ).toThrow(/明文凭据/);
  });

  it("构造参数含 password 应被拒绝", async () => {
    const { MssqlDriver } = await import("../src/runtime/sql/driver.js");
    expect(
      () =>
        new MssqlDriver({
          // @ts-expect-error 刻意传入非法形状
          dataSource: { id: "d1" },
          password: "PLAIN",
        } as never),
    ).toThrow(/明文凭据/);
  });

  it("缺少 dataSource 应被拒绝（不得静默使用空凭据）", async () => {
    const { MssqlDriver } = await import("../src/runtime/sql/driver.js");
    expect(() => new MssqlDriver({} as never)).toThrow(/dataSource/);
  });
});

describe("[P0-4] convertPlaceholders 必须保护字符串字面量与注释", () => {
  it("单引号字面量内的 :name 不得被改写", async () => {
    const { convertPlaceholders } = await import("../src/runtime/sql/driver.js");
    const out = convertPlaceholders("SELECT a FROM vw_ai_x WHERE s = ':end_date' AND t = :end_date");
    expect(out).toContain("':end_date'");
    expect(out).toContain("@end_date");
  });

  it("行注释内的 :name 不得被改写", async () => {
    const { convertPlaceholders } = await import("../src/runtime/sql/driver.js");
    const out = convertPlaceholders("SELECT a FROM vw_ai_x -- note :foo\nWHERE t = :y");
    expect(out).toContain("-- note :foo");
    expect(out).toContain("@y");
  });

  it("块注释内的 :name 不得被改写", async () => {
    const { convertPlaceholders } = await import("../src/runtime/sql/driver.js");
    const out = convertPlaceholders("SELECT a FROM vw_ai_x /* :c */ WHERE t = :y");
    expect(out).toContain("/* :c */");
    expect(out).toContain("@y");
  });
});
