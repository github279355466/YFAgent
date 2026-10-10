/**
 * 真机测试基础设施 —— MCP JSON-RPC 客户端 + 统一断言器 + 场景结果收集器。
 *
 * 设计要点：
 *   1. 测试对象是「已在 4001 端口运行的 MCP Server」，不启动新进程、不改造服务。
 *   2. 走 HTTP /mcp（Bearer token + Accept: application/json, text/event-stream），
 *      与真实 Agent 调用链路一致。
 *   3. 真机用例默认 skip，只有 YF_LIVE=1 才真正连网（见 isLiveEnabled）。
 *
 * ⚠️ 本文件不含任何凭证原文 —— token / 账套 / 内网 IP 全部来自环境变量。
 */

import { beforeAll, expect } from 'vitest';

// ------------------------------------------------------------------ 开关

/** 真机测试总开关。未设置 YF_LIVE=1 时，全部 live 用例必须 skip。 */
export function isLiveEnabled(): boolean {
  return process.env['YF_LIVE'] === '1';
}

/** MCP Server 地址（默认本机 4001）。 */
export const MCP_BASE = process.env['YF_MCP_URL'] ?? `http://localhost:${process.env['YF_MCP_PORT'] ?? '4001'}`;

/** ERP token（Bearer）。真机测试必填。 */
export const MCP_TOKEN = process.env['YF_USER_TOKEN'] ?? '';

/** 账套编号（仅用于报告展示，调用链路由服务端 .env 决定）。 */
export const COMPANY_ID = process.env['YF_COMPANY_ID'] ?? '';

// ------------------------------------------------------------------ 结果收集

export type Verdict = 'PASS' | 'FAIL' | 'WARN';

export interface ScenarioResult {
  /** 场景名，如 "主数据/plant/create" */
  scenario: string;
  /** 业务对象 type_key */
  object: string;
  /** 操作，如 query / read / create / update / approve / disapprove / delete */
  operation: string;
  /** 预期 */
  expected: string;
  /** 实测摘要 */
  actual: string;
  /** 结论 */
  verdict: Verdict;
  /** 耗时 ms */
  elapsedMs: number;
  /** 备注（失败原因 / 口径说明 / 警告理由） */
  note: string;
}

/** 全局收集器：所有场景结果按执行顺序累积，供报告生成。 */
export const scenarioResults: ScenarioResult[] = [];

/** 残留测试数据清单（create 出来的、不清理的）。 */
export interface ResidualRecord {
  object: string;
  primaryKey: Record<string, unknown>;
  reason: string;
}

export const residualRecords: ResidualRecord[] = [];

/** 发现的缺陷清单。 */
export interface DefectRecord {
  id: string;
  title: string;
  detail: string;
  severity: 'blocker' | 'major' | 'minor';
  scenario: string;
}

export const defectRecords: DefectRecord[] = [];

/** 记一条场景结果。 */
export function recordScenario(r: ScenarioResult): void {
  scenarioResults.push(r);
}

/** 记一条残留数据。 */
export function recordResidual(object: string, primaryKey: Record<string, unknown>, reason: string): void {
  residualRecords.push({ object, primaryKey, reason });
}

/** 记一条缺陷。 */
export function recordDefect(d: DefectRecord): void {
  defectRecords.push(d);
}

// ------------------------------------------------------------------ MCP 客户端

interface RpcResult {
  status: number;
  sessionId?: string;
  data: Record<string, unknown>;
}

/** 从 SSE 或纯 JSON 响应体中提取 JSON-RPC 数据。 */
function parseBody(text: string): Record<string, unknown> {
  const dataLines = text.split('\n').filter((l) => l.startsWith('data: '));
  if (dataLines.length > 0) {
    const last = dataLines[dataLines.length - 1]!;
    try {
      return JSON.parse(last.slice(6)) as Record<string, unknown>;
    } catch {
      /* fallthrough */
    }
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

/** MCP 会话（一次 initialize + 复用 mcp-session-id）。 */
export class McpSession {
  private sessionId: string | undefined;
  private nextId = 1;

  public constructor(private readonly token: string) {}

  /** 建立会话：initialize → notifications/initialized。 */
  public async connect(): Promise<void> {
    const init = await this.rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'yf-live-e2e', version: '1.0.0' },
    });
    if (init.status !== 200) {
      throw new Error(`MCP initialize 失败：HTTP ${init.status} ${JSON.stringify(init.data).slice(0, 300)}`);
    }
    this.sessionId = init.sessionId;
    if (!this.sessionId) {
      throw new Error('MCP initialize 未返回 mcp-session-id 头');
    }
    await this.rpc('notifications/initialized', {});
  }

  /** 底层 JSON-RPC 调用。 */
  public async rpc(method: string, params: Record<string, unknown>): Promise<RpcResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;

    const response = await fetch(`${MCP_BASE}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: this.nextId++, method, params }),
    });
    const sid = response.headers.get('mcp-session-id') ?? undefined;
    const data = parseBody(await response.text());
    return sid ? { status: response.status, sessionId: sid, data } : { status: response.status, data };
  }

  /** 调用 MCP 工具，返回解析后的 payload（工具的 content[0].text 反序列化）。 */
  public async callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
    const started = Date.now();
    const r = await this.rpc('tools/call', { name, arguments: args });
    const elapsedMs = Date.now() - started;

    const result = r.data['result'] as { content?: Array<{ text?: string }> } | undefined;
    const text = result?.content?.[0]?.text ?? '';
    let parsed: Record<string, unknown> | undefined;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = undefined;
    }
    const isError = r.data['error'] !== undefined;
    return { status: r.status, text, parsed, elapsedMs, isError, raw: r.data };
  }
}

export interface ToolCallResult {
  status: number;
  text: string;
  parsed?: Record<string, unknown>;
  elapsedMs: number;
  isError: boolean;
  raw: Record<string, unknown>;
}

// ------------------------------------------------------------------ 健康检查

export interface HealthPayload {
  status?: string;
  service?: string;
  tools?: number;
  erp?: string;
  auth?: string;
  [k: string]: unknown;
}

/** 读取 /health（公开端点，无需 token）。 */
export async function fetchHealth(): Promise<HealthPayload> {
  const response = await fetch(`${MCP_BASE}/health`);
  return (await response.json()) as HealthPayload;
}

// ------------------------------------------------------------------ 共享 beforeAll

let sharedSession: McpSession | undefined;
let healthChecked = false;

/**
 * live 用例共用的 session。
 *
 * 首次调用时连一次 MCP 并校验 /health；后续用例复用同一 session。
 * 若 /health 不可达，抛出明确错误（报告侧会标 BLOCKED）。
 */
export async function getSession(): Promise<McpSession> {
  if (!isLiveEnabled()) {
    throw new Error('真机测试未启用：需要环境变量 YF_LIVE=1');
  }
  if (!MCP_TOKEN) {
    throw new Error('缺少 YF_USER_TOKEN：真机测试需要 ERP 身份令牌（禁止写入仓库）');
  }
  if (sharedSession) return sharedSession;

  if (!healthChecked) {
    const health = await fetchHealth().catch((err: unknown) => {
      throw new Error(
        `MCP /health 不可达（${MCP_BASE}）：${err instanceof Error ? err.message : String(err)}。` +
        '请确认 4001 端口上的 yfcli-mcp 服务已启动。',
      );
    });
    expect(health.status).toBe('ok');
    healthChecked = true;
  }

  const session = new McpSession(MCP_TOKEN);
  await session.connect();
  sharedSession = session;
  return session;
}

// ------------------------------------------------------------------ ERP 响应断言helper

/**
 * 判断易飞响应是否业务成功。
 *
 * 成功判据：execution.code === '0' | '-0'（禁止字符串匹配 description）。
 */
export function isSuccessEnvelope(payload: unknown): boolean {
  const exec = extractExecution(payload);
  return exec?.code === '0' || exec?.code === '-0';
}

/** 从 yf_run 的 result 或原始 envelope 中提取 execution。 */
export function extractExecution(payload: unknown): { code?: string; description?: string } | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const rec = payload as Record<string, unknown>;

  // yf_run 标准模式：{ success, type_key, operation, result }
  const result = rec['result'];
  if (typeof result === 'object' && result !== null) {
    const fromResult = digExecution(result);
    if (fromResult) return fromResult;
  }
  return digExecution(rec);
}

function digExecution(node: unknown): { code?: string; description?: string } | undefined {
  if (typeof node !== 'object' || node === null) return undefined;
  const rec = node as Record<string, unknown>;

  const stdData = rec['std_data'];
  if (typeof stdData === 'object' && stdData !== null) {
    const exec = (stdData as Record<string, unknown>)['execution'];
    if (typeof exec === 'object' && exec !== null) {
      const e = exec as Record<string, unknown>;
      const out: { code?: string; description?: string } = {};
      if (typeof e['code'] === 'string') out.code = e['code'];
      if (typeof e['description'] === 'string') out.description = e['description'];
      return out;
    }
  }
  return undefined;
}

/** 从 yf_run 返回值中取出 ERP 响应体（std_data 或其等价物）。 */
export function extractStdData(payload: unknown): Record<string, unknown> | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const rec = payload as Record<string, unknown>;
  const result = rec['result'];
  const target = typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : rec;
  const stdData = target['std_data'];
  return typeof stdData === 'object' && stdData !== null ? (stdData as Record<string, unknown>) : undefined;
}

/**
 * 从工具返回中提取 query 行数据。
 *
 * ⚠️ 两条返回形态并存，必须都兼容：
 *   1. `yf_query` 直接返回扁平结构：`{ type_key, total_result, rows: [...] }`
 *   2. `yf_run` 包了一层：`{ success, result: { std_data: { parameter: { result: { rows } } } } }`
 */
export function extractRows(payload: unknown): Record<string, unknown>[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const rec = payload as Record<string, unknown>;

  // 形态 1：yf_query 扁平返回
  if (Array.isArray(rec['rows'])) {
    return rec['rows'] as Record<string, unknown>[];
  }

  // 形态 2：嵌套在 std_data 里
  const std = extractStdData(rec);
  if (!std) return [];
  const parameter = std['parameter'];
  if (typeof parameter !== 'object' || parameter === null) return [];
  const result = (parameter as Record<string, unknown>)['result'];
  if (typeof result !== 'object' || result === null) return [];
  const rows = (result as Record<string, unknown>)['rows'];
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

/** 从 ERP 响应中提取 total_result。 */
export function extractTotal(payload: unknown): number | undefined {
  const std = extractStdData(payload);
  if (!std) return undefined;
  const parameter = std['parameter'];
  if (typeof parameter !== 'object' || parameter === null) return undefined;
  const total = (parameter as Record<string, unknown>)['total_result'];
  return typeof total === 'number' ? total : undefined;
}

/**
 * 提取主键类操作（read / delete / approve / disapprove / invalid）的返回项。
 *
 * ⚠️ 两条返回形态并存，必须都兼容：
 *   1. `yf_read` 工具直接返回扁平结构：`{ type_key, item_count, empty, rows: [...] }`
 *      —— 注意它复用 `rows` 字段名，但内容是节点对象数组（如 `[{sales_order_data:[...]}]`）
 *   2. `yf_run` 包了一层：`{ result: { std_data: { parameter: { result: { success } } } } }`
 */
export function extractSuccessItems(payload: unknown): Record<string, unknown>[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const rec = payload as Record<string, unknown>;

  // 形态 1：yf_read 扁平返回（复用 rows 字段名）
  if (Array.isArray(rec['rows'])) {
    return rec['rows'] as Record<string, unknown>[];
  }

  // 形态 1b：yf_run 归一化后的 result.items[]
  //   write 类操作（create）经 yf_run 返回 {success,type_key,operation,result:{items:[...]}}，
  //   其中 items[] 携带 ERP 回传的自动单号等信息（真机示例 doc_no="20261010005"）。
  const resultBlock = rec['result'];
  if (typeof resultBlock === 'object' && resultBlock !== null) {
    const items = (resultBlock as Record<string, unknown>)['items'];
    if (Array.isArray(items)) return items as Record<string, unknown>[];
  }

  // 形态 2：嵌套在 std_data.parameter.result.success
  const std = extractStdData(rec);
  if (!std) return [];
  const parameter = std['parameter'];
  if (typeof parameter !== 'object' || parameter === null) return [];
  const result = (parameter as Record<string, unknown>)['result'];
  if (typeof result !== 'object' || result === null) return [];
  const success = (result as Record<string, unknown>)['success'];
  return Array.isArray(success) ? (success as Record<string, unknown>[]) : [];
}

/**
 * 提取错误明细，兼容易飞两种结构。
 *
 *   结构 A：error[].message
 *   结构 B：error[].information[].message   ← 真机实测大量出现
 *
 * ⚠️ 结构 B 是「错误被静默吞掉」的唯一防线，必须解析。
 * 同时会从 yf_run 的 error.message（本地包装层）兜底。
 */
export function extractErrorMessages(payload: unknown): string[] {
  const messages: string[] = [];

  const collect = (nodes: unknown): void => {
    if (!Array.isArray(nodes)) return;
    for (const item of nodes) {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec['message'] === 'string') messages.push(rec['message']);
      // 结构 B：information[] 嵌套
      collect(rec['information']);
      // 少数场景 error 直接嵌套 error
      collect(rec['error']);
    }
  };

  const std = extractStdData(payload);
  if (std) {
    collect(std['error']);
    const parameter = std['parameter'];
    if (typeof parameter === 'object' && parameter !== null) {
      const result = (parameter as Record<string, unknown>)['result'];
      if (typeof result === 'object' && result !== null) {
        collect((result as Record<string, unknown>)['error']);
      }
    }
  }

  // yf_run 本地包装层：{ success:false, error:{ type, message } }
  if (typeof payload === 'object' && payload !== null) {
    const err = (payload as Record<string, unknown>)['error'];
    if (typeof err === 'object' && err !== null && typeof (err as Record<string, unknown>)['message'] === 'string') {
      messages.push((err as Record<string, unknown>)['message'] as string);
    }
  }

  return messages;
}

/** 兼容旧名：返回原始 error[] 数组。 */
export function extractErrors(payload: unknown): Array<Record<string, unknown>> {
  const std = extractStdData(payload);
  if (!std) return [];
  const error = std['error'];
  if (Array.isArray(error)) return error as Array<Record<string, unknown>>;
  return [];
}

// ------------------------------------------------------------------ 场景执行包装

export interface ScenarioOptions {
  scenario: string;
  object: string;
  operation: string;
  expected: string;
}

/**
 * 执行一个场景并自动记录结果。
 *
 * fn 返回 { actual, verdict, note }；抛异常记为 FAIL 并把异常写入 note。
 * 这样「一个场景炸了不会带走整个文件的其余场景」。
 */
export async function runScenario(
  options: ScenarioOptions,
  fn: () => Promise<{ actual: string; verdict?: Verdict; note?: string }>,
): Promise<ScenarioResult> {
  const started = Date.now();
  let result: ScenarioResult;
  try {
    const outcome = await fn();
    result = {
      scenario: options.scenario,
      object: options.object,
      operation: options.operation,
      expected: options.expected,
      actual: outcome.actual,
      verdict: outcome.verdict ?? 'PASS',
      elapsedMs: Date.now() - started,
      note: outcome.note ?? '',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    result = {
      scenario: options.scenario,
      object: options.object,
      operation: options.operation,
      expected: options.expected,
      actual: `执行抛异常：${message.slice(0, 300)}`,
      verdict: 'FAIL',
      elapsedMs: Date.now() - started,
      note: message,
    };
  }
  recordScenario(result);
  return result;
}

// ------------------------------------------------------------------ 节点解包

/**
 * 从 read 返回的节点对象中取出内层业务节点（如 plant_data / sales_order_data）。
 *
 * 易飞 read 回参形如 `{ plant_data: { ...fields } }`，
 * 业务字段在内层对象里，不在外层。外层可能同时含多个节点（单头 + 单身）。
 */
export function firstNodePayload(node: Record<string, unknown>): Record<string, unknown> | undefined {
  for (const value of Object.values(node)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    // 节点值也可能是数组（如 { sales_order_data: [ {...} ] }）
    if (Array.isArray(value) && value.length > 0) {
      const head = value[0];
      if (typeof head === 'object' && head !== null) return head as Record<string, unknown>;
    }
  }
  return undefined;
}

/** 取出 read 回参里全部内层节点名（用于校验单身节点存在性）。 */
export function nodeNames(node: Record<string, unknown>): string[] {
  return Object.entries(node)
    .filter(([, v]) => typeof v === 'object' && v !== null)
    .map(([k]) => k);
}
/**
 * 提取 error[].information[].data —— ERP 回传的「缺失字段清单」。
 *
 * 真机形态：`{ error: [{ data: {...}, information: [{ message: "字段不可空白!", data: { trans_currency:"", ... } }] }] }`
 * 这是定位「哪几个字段必填」的唯一线索，报告里必须带上。
 */
export function extractErrorData(payload: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const std = extractStdData(payload);
  if (!std) return out;
  const parameter = std['parameter'];
  if (typeof parameter !== 'object' || parameter === null) return out;
  const result = (parameter as Record<string, unknown>)['result'];
  if (typeof result !== 'object' || result === null) return out;
  const errors = (result as Record<string, unknown>)['error'];
  if (!Array.isArray(errors)) return out;
  for (const item of errors) {
    if (typeof item !== 'object' || item === null) continue;
    const info = (item as Record<string, unknown>)['information'];
    if (!Array.isArray(info)) continue;
    for (const inner of info) {
      if (typeof inner !== 'object' || inner === null) continue;
      const data = (inner as Record<string, unknown>)['data'];
      if (typeof data === 'object' && data !== null) out.push(data as Record<string, unknown>);
    }
  }
  return out;
}
// ------------------------------------------------------------------ 空结果判定

/**
 * 判定 read 返回是否「真的查到了记录」。
 *
 * ⚠️ 易飞的 `yf_read` 对**错误主键**返回：
 *     `{ item_count: 1, empty: false, rows: [{ plant_data: [] }] }`
 * 即外层数组仍有 1 个元素（节点壳），但内层业务数组为空。
 * 因此**不能只看 rows.length**，必须下钻到节点内层数组判断。
 *
 * 这是「主键全错返 code=0」这条硬约束在现场的具体表现 —— 调用方若只看
 * `item_count>0` 或 `code=0`，会把「查无此单」误判为「查到 1 条」。
 */
export function countRealRecords(items: Record<string, unknown>[]): number {
  let count = 0;
  for (const item of items) {
    let found = false;
    for (const value of Object.values(item)) {
      if (Array.isArray(value)) {
        if (value.length > 0) found = true;
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        found = true;
      }
    }
    if (found) count += 1;
  }
  return count;
}
// ------------------------------------------------------------------ 命名工具

/**
 * 生成带时间戳的测试主键，避免与真实数据冲突。
 *
 * ⚠️ 易飞主键多为 `char(N)` 定长列，超长会被 SQL 拒绝（
 *    「将截断字符串或二进制数据」）。实测：plant_no = char(6)、
 *    customer_no/supplier_no/item_no/warehouse_no 亦为短定长列。
 *    因此**必须显式传入目标列宽**，生成值不得超出。
 *
 * @param maxLen 目标列的最大长度（从 field-index.csv 或实测确定）
 */
export function testKey(maxLen: number): string {
  const base = 'T' + Date.now().toString(36).slice(-5).toUpperCase();
  return base.slice(0, Math.max(1, maxLen));
}

/**
 * 生成单号类测试值（doc_no 通常较长，可放宽）。
 *
 * @param maxLen 目标列最大长度
 */
export function docKey(maxLen: number): string {
  const base = 'TEST' + Date.now().toString(36).toUpperCase();
  return base.slice(0, Math.max(1, maxLen));
}

/** 生成唯一的时间戳后缀（用于需要稳定长度的场景）。 */
export function stamp(): string {
  return Date.now().toString(36).toUpperCase().slice(-6);
}

/** 侧车目录（runs/.live-sidecar，已 gitignore）。 */
export const SIDECAR_PATH = resolveSidecarDir();

function resolveSidecarDir(): string {
  const cwd = process.cwd();
  const idx = cwd.lastIndexOf('packages');
  const root = idx > 0 ? cwd.slice(0, idx) : cwd;
  return `${root.replace(/[\\/]+$/, '')}/runs/.live-sidecar`;
}

/** 报告落地路径（runs/ 已 gitignore）。 */
export function reportPath(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `runs/e2e-${stamp}.md`;
}

beforeAll(() => {
  // 占位：确保 vitest 收集器加载本文件的 hooks 类型
});