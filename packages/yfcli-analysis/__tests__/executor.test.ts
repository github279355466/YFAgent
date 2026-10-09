import { describe, it, expect } from "vitest";
import { SqlExecutor, type SqlDriver } from "../src/runtime/sql/executor.js";
import { defineTemplate } from "../src/runtime/sql/template.js";
import type { SqlConfig } from "../src/runtime/sql/config.js";

const testTemplate = defineTemplate({
  id: "test_tmpl",
  label: "测试模板",
  params: [{ name: "start_date", type: "string", required: true }],
  sql: "SELECT TOP (:max_rows) col FROM vw_ai_test WHERE dt >= :start_date",
  max_rows: 100,
  timeout_ms: 5000,
});

const fakeDriver: SqlDriver = {
  async query(_sql, _values, _opts) {
    return [{ col: "value" }];
  },
};

const validConfig: SqlConfig = {
  version: "1.0",
  datasources: [
    {
      id: "test-ds",
      server: "localhost",
      database: "testdb",
      user_env: "TEST_USER",
      password_env: "TEST_PASS",
      limits: { max_rows: 10000, timeout_ms: 30000 },
      allowed_templates: ["test_tmpl"],
    },
  ],
};

describe("SqlExecutor", () => {
  it("应正常执行已注册且在白名单中的模板", async () => {
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: fakeDriver,
    });
    const rows = await executor.execute("test_tmpl", { start_date: "20260101" });
    expect(rows).toHaveLength(1);
  });

  it("应拒绝未注册的模板", async () => {
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: fakeDriver,
    });
    await expect(executor.execute("nonexistent", {})).rejects.toThrow(/SQL 模板未注册/);
  });

  it("应拒绝不在白名单中的模板", async () => {
    const restrictedConfig: SqlConfig = {
      version: "1.0",
      datasources: [
        {
          ...validConfig.datasources[0]!,
          allowed_templates: [], // 空白名单 → validateSqlConfig 会拦，这里测 executor 层
        },
      ],
    };
    // 跳过 config 校验直接构造（测 executor 的 resolveDataSource）
    const executor = new SqlExecutor({
      config: { version: "1.0", datasources: [{ ...validConfig.datasources[0]!, allowed_templates: ["other"] }] },
      templates: [testTemplate],
      driver: fakeDriver,
      validateWhitelist: false, // 跳过启动校验以测试运行时
    });
    await expect(executor.execute("test_tmpl", { start_date: "20260101" })).rejects.toThrow(
      /不在任何数据源的 allowed_templates/,
    );
  });

  it("★ L3 白名单门禁：allowed_templates 缺少已注册模板应抛错", () => {
    const badConfig: SqlConfig = {
      version: "1.0",
      datasources: [
        {
          ...validConfig.datasources[0]!,
          allowed_templates: [], // 缺 test_tmpl
        },
      ],
    };
    expect(
      () => new SqlExecutor({ config: badConfig, templates: [testTemplate], driver: fakeDriver }),
    ).toThrow(/缺少已注册模板.*test_tmpl/);
  });

  it("★ L3 白名单门禁：allowed_templates 含未注册模板应抛错", () => {
    const badConfig: SqlConfig = {
      version: "1.0",
      datasources: [
        {
          ...validConfig.datasources[0]!,
          allowed_templates: ["test_tmpl", "ghost_template"],
        },
      ],
    };
    expect(
      () => new SqlExecutor({ config: badConfig, templates: [testTemplate], driver: fakeDriver }),
    ).toThrow(/包含未注册模板.*ghost_template/);
  });
});
