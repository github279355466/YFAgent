import { describe, it, expect } from "vitest";
import { BUILTIN_TEMPLATES } from "../src/runtime/sql/templates.js";
import { validateTemplate } from "../src/runtime/sql/template.js";

/**
 * ★ 白名单与模板库一致性门禁
 *
 * 确保：
 *   1. 所有内置模板都通过 vw_ai_* 白名单校验
 *   2. 示例配置中的 allowed_templates 数量 === 注册模板数量
 *   3. 每个模板的 SQL 只引用 vw_ai_* 视图
 */
describe("★ 白名单门禁", () => {
  it("所有内置模板应通过 vw_ai_* 白名单校验", () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(() => validateTemplate(t)).not.toThrow();
    }
  });

  it("内置模板数量应为 20", () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(20);
  });

  it("所有模板 id 应唯一", () => {
    const ids = BUILTIN_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("示例配置的 allowed_templates 数量应等于模板库数量", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const configPath = join(import.meta.dirname ?? ".", "..", "config", "analysis-sql.example.json");
    const raw = readFileSync(configPath, "utf8");
    const cfg = JSON.parse(raw) as { datasources: { allowed_templates: string[] }[] };
    const allowedCount = cfg.datasources[0]!.allowed_templates.length;
    expect(allowedCount).toBe(BUILTIN_TEMPLATES.length);
  });

  it("示例配置的 allowed_templates 应包含所有模板 id", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const configPath = join(import.meta.dirname ?? ".", "..", "config", "analysis-sql.example.json");
    const raw = readFileSync(configPath, "utf8");
    const cfg = JSON.parse(raw) as { datasources: { allowed_templates: string[] }[] };
    const allowedSet = new Set(cfg.datasources[0]!.allowed_templates);
    for (const t of BUILTIN_TEMPLATES) {
      expect(allowedSet.has(t.id), `缺少模板 ${t.id}`).toBe(true);
    }
  });
});
