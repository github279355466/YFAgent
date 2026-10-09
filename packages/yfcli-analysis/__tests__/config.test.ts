import { describe, it, expect } from "vitest";
import { validateSqlConfig, resolveCredentials, type SqlConfig } from "../src/runtime/sql/config.js";

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
      allowed_templates: ["tmpl_a"],
    },
  ],
};

describe("validateSqlConfig", () => {
  it("应通过合法配置校验", () => {
    expect(() => validateSqlConfig(validConfig)).not.toThrow();
  });

  it("应拒绝含明文 password 字段", () => {
    const bad = {
      ...validConfig,
      datasources: [{ ...validConfig.datasources[0]!, password: "secret123" }],
    };
    expect(() => validateSqlConfig(bad as SqlConfig)).toThrow(/明文凭据字段.*password/);
  });

  it("应拒绝缺少 user_env / password_env", () => {
    const bad = {
      ...validConfig,
      datasources: [{ ...validConfig.datasources[0]!, user_env: "", password_env: "" }],
    };
    expect(() => validateSqlConfig(bad)).toThrow(/缺少 user_env \/ password_env/);
  });

  it("应拒绝非法 limits", () => {
    const bad = {
      ...validConfig,
      datasources: [{ ...validConfig.datasources[0]!, limits: { max_rows: 0, timeout_ms: -1 } }],
    };
    expect(() => validateSqlConfig(bad)).toThrow(/缺少或非法的 limits/);
  });

  it("应拒绝空 allowed_templates", () => {
    const bad = {
      ...validConfig,
      datasources: [{ ...validConfig.datasources[0]!, allowed_templates: [] }],
    };
    expect(() => validateSqlConfig(bad)).toThrow(/allowed_templates 为空/);
  });

  it("应拒绝空 datasources", () => {
    const bad = { version: "1.0", datasources: [] };
    expect(() => validateSqlConfig(bad)).toThrow(/缺少 datasources/);
  });
});

describe("resolveCredentials", () => {
  it("应从环境变量取凭据", () => {
    process.env["TEST_CRED_USER"] = "admin";
    process.env["TEST_CRED_PASS"] = "secret";
    const ds = { ...validConfig.datasources[0]!, user_env: "TEST_CRED_USER", password_env: "TEST_CRED_PASS" };
    const cred = resolveCredentials(ds);
    expect(cred.user).toBe("admin");
    expect(cred.password).toBe("secret");
    delete process.env["TEST_CRED_USER"];
    delete process.env["TEST_CRED_PASS"];
  });

  it("缺少环境变量应抛错", () => {
    delete process.env["MISSING_USER"];
    delete process.env["MISSING_PASS"];
    const ds = { ...validConfig.datasources[0]!, user_env: "MISSING_USER", password_env: "MISSING_PASS" };
    expect(() => resolveCredentials(ds)).toThrow(/缺少环境变量/);
  });
});
