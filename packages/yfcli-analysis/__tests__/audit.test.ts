import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  consoleAuditSink,
  memoryAuditSink,
  sanitizeParams,
  truncateError,
  type AuditEntry,
} from "../src/runtime/sql/audit.js";
import { SqlExecutor, type SqlDriver } from "../src/runtime/sql/executor.js";
import { defineTemplate } from "../src/runtime/sql/template.js";
import type { SqlConfig } from "../src/runtime/sql/config.js";

// ─── 测试 fixtures ──────────────────────────────────────

const testTemplate = defineTemplate({
  id: "audit_tmpl",
  label: "审计测试模板",
  params: [
    { name: "start_date", type: "string", required: true },
    { name: "password", type: "string", required: false },
    { name: "api_token", type: "string", required: false },
    { name: "long_field", type: "string", required: false },
  ],
  sql: "SELECT TOP (:max_rows) col FROM vw_ai_audit_test WHERE dt >= :start_date",
  max_rows: 100,
  timeout_ms: 5000,
});

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
      allowed_templates: ["audit_tmpl"],
    },
  ],
};

function makeSuccessDriver(rows: Record<string, unknown>[] = [{ col: "v1" }]): SqlDriver {
  return {
    async query() {
      return rows;
    },
  };
}

function makeFailDriver(errMsg = "DB connection lost"): SqlDriver {
  return {
    async query() {
      throw new Error(errMsg);
    },
  };
}

// ─── sanitizeParams ──────────────────────────────────────

describe("sanitizeParams", () => {
  it("应将 password/token/secret 字段值替换为 ***", () => {
    const result = sanitizeParams({
      password: "my-secret-123",
      api_token: "tok_abc",
      client_secret: "sec_xyz",
      normal_field: "hello",
    });
    expect(result.password).toBe("***");
    expect(result.api_token).toBe("***");
    expect(result.client_secret).toBe("***");
    expect(result.normal_field).toBe("hello");
  });

  it("应截断超过 50 字符的字符串值", () => {
    const longStr = "A".repeat(60);
    const result = sanitizeParams({ long_field: longStr });
    expect(result.long_field).toBe("A".repeat(50) + "...");
  });

  it("不应修改短字符串和非字符串值", () => {
    const result = sanitizeParams({
      short: "ok",
      num: 42,
      bool: true,
      nil: null,
    });
    expect(result.short).toBe("ok");
    expect(result.num).toBe(42);
    expect(result.bool).toBe(true);
    expect(result.nil).toBe(null);
  });

  it("敏感字段即使值很短也应掩码", () => {
    const result = sanitizeParams({ token: "ab" });
    expect(result.token).toBe("***");
  });
});

// ─── truncateError ──────────────────────────────────────

describe("truncateError", () => {
  it("应截断超过 200 字符的错误信息", () => {
    const longErr = new Error("X".repeat(250));
    const result = truncateError(longErr);
    expect(result).toHaveLength(203); // 200 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  it("短错误信息保持不变", () => {
    expect(truncateError(new Error("short"))).toBe("short");
  });

  it("非 Error 对象转为字符串", () => {
    expect(truncateError("plain string")).toBe("plain string");
  });
});

// ─── consoleAuditSink ──────────────────────────────────────

describe("consoleAuditSink", () => {
  it("应输出合法 JSON 到 console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const entry: AuditEntry = {
      timestamp: "2026-10-09T00:00:00.000Z",
      templateId: "t1",
      params: { x: 1 },
      rowCount: 5,
      durationMs: 10,
      status: "success",
    };
    consoleAuditSink(entry);
    expect(spy).toHaveBeenCalledTimes(1);
    const logged = spy.mock.calls[0]![0] as string;
    expect(JSON.parse(logged)).toEqual(entry);
    spy.mockRestore();
  });
});

// ─── memoryAuditSink ──────────────────────────────────────

describe("memoryAuditSink", () => {
  it("应收集所有写入的条目", () => {
    const { sink, entries } = memoryAuditSink();
    const e1: AuditEntry = {
      timestamp: "2026-10-09T00:00:00.000Z",
      templateId: "t1",
      params: {},
      rowCount: 1,
      durationMs: 5,
      status: "success",
    };
    const e2: AuditEntry = { ...e1, templateId: "t2", status: "error", error: "fail" };
    sink(e1);
    sink(e2);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.templateId).toBe("t1");
    expect(entries[1]!.status).toBe("error");
  });
});

// ─── Executor + 审计集成 ──────────────────────────────────────

describe("SqlExecutor L4 审计", () => {
  it("成功执行后应产生 status=success 审计条目", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver([{ col: "a" }, { col: "b" }]),
      auditSink: sink,
    });

    await executor.execute("audit_tmpl", { start_date: "20260101" });

    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.status).toBe("success");
    expect(entry.templateId).toBe("audit_tmpl");
    expect(entry.rowCount).toBe(2);
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    expect(entry.timestamp).toBeTruthy();
    expect(entry.error).toBeUndefined();
  });

  it("失败执行后应产生 status=error 审计条目", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeFailDriver("timeout exceeded"),
      auditSink: sink,
    });

    await expect(executor.execute("audit_tmpl", { start_date: "20260101" })).rejects.toThrow(
      /执行失败/,
    );

    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.status).toBe("error");
    expect(entry.rowCount).toBe(0);
    expect(entry.error).toContain("timeout exceeded");
  });

  it("审计条目参数应脱敏", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      auditSink: sink,
    });

    await executor.execute("audit_tmpl", {
      start_date: "20260101",
      password: "super-secret",
      api_token: "tok_live_xxx",
      long_field: "B".repeat(80),
    });

    const params = entries[0]!.params;
    expect(params.password).toBe("***");
    expect(params.api_token).toBe("***");
    expect(params.long_field).toBe("B".repeat(50) + "...");
    expect(params.start_date).toBe("20260101");
  });

  it("auditSink 抛错不应中断业务执行", async () => {
    const badSink = () => {
      throw new Error("sink exploded");
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver([{ col: "safe" }]),
      auditSink: badSink,
    });

    // 业务应正常返回
    const rows = await executor.execute("audit_tmpl", { start_date: "20260101" });
    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).col).toBe("safe");

    // 应有 warn 日志
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("审计 sink 异常"));
    warnSpy.mockRestore();
  });

  it("setAuditSink(null) 应禁用审计", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      auditSink: sink,
    });

    // 先确认审计正常工作
    await executor.execute("audit_tmpl", { start_date: "20260101" });
    expect(entries).toHaveLength(1);

    // 禁用后不再产生条目
    executor.setAuditSink(null);
    await executor.execute("audit_tmpl", { start_date: "20260101" });
    expect(entries).toHaveLength(1); // 仍然是 1
  });

  it("审计条目应包含 userId（如果构造时传入）", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      auditSink: sink,
      userId: "user-007",
    });

    await executor.execute("audit_tmpl", { start_date: "20260101" });
    expect(entries[0]!.userId).toBe("user-007");
  });

  it("审计条目应包含 dataSourceId（如果执行时传入）", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      auditSink: sink,
    });

    await executor.execute("audit_tmpl", { start_date: "20260101" }, { dataSourceId: "test-ds" });
    expect(entries[0]!.dataSourceId).toBe("test-ds");
  });

  it("config.audit.enabled=false 且未传 auditSink 时应禁用审计", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const configNoAudit: SqlConfig = {
      ...validConfig,
      audit: { enabled: false },
    };
    const executor = new SqlExecutor({
      config: configNoAudit,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      // 不传 auditSink → 应因 audit.enabled=false 而禁用
    });

    await executor.execute("audit_tmpl", { start_date: "20260101" });
    // console.log 不应被调用（默认 consoleAuditSink 未激活）
    expect(logSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("审计条目包含所有必填字段", async () => {
    const { sink, entries } = memoryAuditSink();
    const executor = new SqlExecutor({
      config: validConfig,
      templates: [testTemplate],
      driver: makeSuccessDriver(),
      auditSink: sink,
    });

    await executor.execute("audit_tmpl", { start_date: "20260101" });
    const entry = entries[0]!;

    // 必填字段检查
    expect(entry).toHaveProperty("timestamp");
    expect(entry).toHaveProperty("templateId");
    expect(entry).toHaveProperty("params");
    expect(entry).toHaveProperty("rowCount");
    expect(entry).toHaveProperty("durationMs");
    expect(entry).toHaveProperty("status");

    // 类型检查
    expect(typeof entry.timestamp).toBe("string");
    expect(typeof entry.templateId).toBe("string");
    expect(typeof entry.params).toBe("object");
    expect(typeof entry.rowCount).toBe("number");
    expect(typeof entry.durationMs).toBe("number");
    expect(["success", "error"]).toContain(entry.status);
  });
});
