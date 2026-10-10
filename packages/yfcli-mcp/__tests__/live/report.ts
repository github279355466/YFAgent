/**
 * 真机报告生成器 —— 汇总各 live 文件写出的侧车结果，生成 Markdown 报告。
 *
 * 为什么走侧车：vitest 默认按文件隔离进程，内存收集器无法跨文件共享。
 * 各 live 文件在 afterAll 写入 runs/.live-sidecar/<tag>.json，
 * 本模块读取并汇总，输出 runs/e2e-<YYYYMMDD>.md（runs/ 已 gitignore）。
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { COMPANY_ID, MCP_BASE, reportPath, SIDECAR_PATH } from './helpers.js';

const CRLF = '\r\n';

export type Verdict = 'PASS' | 'FAIL' | 'WARN';

export interface ScenarioResult {
  scenario: string;
  object: string;
  operation: string;
  expected: string;
  actual: string;
  verdict: Verdict;
  elapsedMs: number;
  note: string;
}

interface ResidualRecord {
  object: string;
  primaryKey: Record<string, unknown>;
  reason: string;
}

interface DefectRecord {
  id: string;
  title: string;
  detail: string;
  severity: string;
  scenario: string;
}

interface SidecarPayload {
  scenarios?: ScenarioResult[];
  residual?: ResidualRecord[];
  defects?: DefectRecord[];
}

/** 表格单元格转义。 */
function cell(text: unknown): string {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function verdictIcon(v: Verdict): string {
  if (v === 'PASS') return '✅ PASS';
  if (v === 'FAIL') return '❌ FAIL';
  return '⚠️ WARN';
}

export interface ReportMeta {
  connected: boolean;
  blockedReason?: string;
  startedAt: Date;
  finishedAt: Date;
  knowledgeNote?: string;
}

/** 读取全部侧车文件。 */
function readSidecars(): {
  scenarios: ScenarioResult[];
  residual: ResidualRecord[];
  defects: DefectRecord[];
  files: number;
} {
  const scenarios: ScenarioResult[] = [];
  const residual: ResidualRecord[] = [];
  const defects: DefectRecord[] = [];
  let files = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(SIDECAR_PATH).filter((n) => n.endsWith('.json'));
  } catch {
    return { scenarios, residual, defects, files };
  }

  for (const name of entries) {
    try {
      const parsed = JSON.parse(readFileSync(resolve(SIDECAR_PATH, name), 'utf-8')) as SidecarPayload;
      files += 1;
      if (Array.isArray(parsed.scenarios)) scenarios.push(...parsed.scenarios);
      if (Array.isArray(parsed.residual)) residual.push(...parsed.residual);
      if (Array.isArray(parsed.defects)) defects.push(...parsed.defects);
    } catch {
      /* 跳过损坏侧车 */
    }
  }
  return { scenarios, residual, defects, files };
}

/** 生成 Markdown 报告并写入 runs/，返回落地路径与统计。 */
export function writeReport(meta: ReportMeta): {
  path: string;
  counts: { total: number; pass: number; warn: number; fail: number; objects: number };
} {
  const { scenarios, residual, defects, files } = readSidecars();

  const pass = scenarios.filter((r) => r.verdict === 'PASS').length;
  const fail = scenarios.filter((r) => r.verdict === 'FAIL').length;
  const warn = scenarios.filter((r) => r.verdict === 'WARN').length;
  const objects = new Set(scenarios.map((r) => r.object));
  const durationMs = meta.finishedAt.getTime() - meta.startedAt.getTime();

  const lines: string[] = [];
  lines.push('# YFAgent 真机端到端场景测试报告');
  lines.push('');
  lines.push(`- 执行时间：${meta.startedAt.toISOString()} ~ ${meta.finishedAt.toISOString()}`);
  lines.push(`- MCP 通道：${MCP_BASE}/mcp（Bearer token + Accept: application/json, text/event-stream）`);
  lines.push(`- 账套：${COMPANY_ID || '（未设置）'}`);
  lines.push(`- 状态：${meta.connected ? '已完成' : '**BLOCKED**（未连上真机）'}`);
  lines.push(`- 侧车文件：${files} 个 [口径：runs/.live-sidecar/ 下 *.json 计数]`);
  if (!meta.connected && meta.blockedReason) {
    lines.push(`- BLOCKED 原因：${cell(meta.blockedReason)}`);
  }
  if (meta.knowledgeNote) lines.push(`- 知识产物：${cell(meta.knowledgeNote)}`);
  lines.push('');
  lines.push('## 一、结论汇总');
  lines.push('');
  lines.push(
    `- 场景总数 **${scenarios.length}** [口径：已执行并记录的场景数]` +
      `，覆盖对象 **${objects.size}** [口径：type_key 去重]`,
  );
  lines.push(`- ✅ PASS ${pass} ｜ ⚠️ WARN ${warn} ｜ ❌ FAIL ${fail}`);
  lines.push(`- 总耗时 ${(durationMs / 1000).toFixed(1)}s`);
  lines.push(
    `- 通过判据：**无 ❌ FAIL**（⚠️ WARN 允许并逐条说明原因）→ ${fail === 0 ? '**满足**' : '**不满足**'}`,
  );
  lines.push('');
  lines.push('## 二、场景矩阵');
  lines.push('');
  lines.push('| 场景 | 对象 | 操作 | 预期 | 实测 | 结论 | 耗时(ms) | 备注 |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of scenarios) {
    lines.push(
      `| ${cell(r.scenario)} | ${cell(r.object)} | ${cell(r.operation)} | ${cell(r.expected)} | ` +
        `${cell(r.actual)} | ${verdictIcon(r.verdict)} | ${r.elapsedMs} | ${cell(r.note)} |`,
    );
  }
  lines.push('');
  lines.push('### 各域覆盖');
  lines.push('');
  for (const domain of ['主数据', '单据', '问数', '归因', '降级']) {
    const inDomain = scenarios.filter((r) => r.scenario.startsWith(domain));
    if (inDomain.length === 0) continue;
    const dPass = inDomain.filter((r) => r.verdict === 'PASS').length;
    const dFail = inDomain.filter((r) => r.verdict === 'FAIL').length;
    const dWarn = inDomain.filter((r) => r.verdict === 'WARN').length;
    lines.push(`- **${domain}**：${inDomain.length} 场景（✅${dPass} ⚠️${dWarn} ❌${dFail}）`);
  }
  lines.push('');
  lines.push('## 三、发现的缺陷');
  lines.push('');
  if (defects.length === 0) {
    lines.push('本轮未登记缺陷。');
  } else {
    lines.push('| # | 严重度 | 标题 | 场景 | 详情 |');
    lines.push('|---|---|---|---|---|');
    defects.forEach((d, i) => {
      lines.push(`| ${i + 1} | ${cell(d.severity)} | ${cell(d.title)} | ${cell(d.scenario)} | ${cell(d.detail)} |`);
    });
  }
  lines.push('');
  lines.push('## 四、残留测试数据清单');
  lines.push('');
  lines.push('> 按既定策略**不清理、只标记**。以下数据保留在账套中，供人工决定是否删除。');
  lines.push('');
  if (residual.length === 0) {
    lines.push('无残留（本轮未产生新增数据）。');
  } else {
    lines.push(`共 **${residual.length}** 笔 [口径：create 成功且未删除的记录数]。`);
    lines.push('');
    lines.push('| 对象 | 主键 | 说明 |');
    lines.push('|---|---|---|');
    for (const r of residual) {
      lines.push(`| ${cell(r.object)} | ${cell(JSON.stringify(r.primaryKey))} | ${cell(r.reason)} |`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('> 本报告由 `packages/yfcli-mcp/__tests__/live/report.ts` 汇总侧车结果自动生成。');
  lines.push('> 报告中不含凭证原文、内网 IP 与令牌。');
  lines.push('');

  const rel = reportPath();
  const abs = resolveRepo(rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, lines.join(CRLF), 'utf-8');

  return { path: abs, counts: { total: scenarios.length, pass, warn, fail, objects: objects.size } };
}

/** 相对仓库根解析报告路径。 */
function resolveRepo(rel: string): string {
  const cwd = process.cwd();
  const idx = cwd.lastIndexOf('packages');
  const root = idx > 0 ? cwd.slice(0, idx) : cwd;
  return `${root.replace(/[\\/]+$/, '')}/${rel}`;
}