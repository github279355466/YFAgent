#!/usr/bin/env node
/**
 * run-live-e2e.mjs —— 真机端到端场景测试入口。
 *
 * 职责：
 *   1. 校验前置（YF_LIVE / YF_USER_TOKEN / MCP /health）
 *   2. 调用 vitest 只跑 *.live.test.ts
 *   3. 汇总 runs/.live-sidecar/*.json → runs/e2e-<date>.md 报告
 *
 * 用法（PowerShell，凭证走环境变量或本地 .env，禁止写死进仓库）：
 *   $env:YF_LIVE = "1"
 *   node scripts/run-live-e2e.mjs
 *
 * ⚠️ 本脚本不改任何仓库文件，只写 runs/（已 gitignore）。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const mcpDir = resolve(root, 'packages', 'yfcli-mcp');
const sidecarDir = resolve(root, 'runs', '.live-sidecar');
const CRLF = '\r\n';

// ---------------------------------------------------------------- .env 载入

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

// ---------------------------------------------------------------- 前置校验

const MCP_PORT = process.env.YF_MCP_PORT || '4001';
const MCP_URL = process.env.YF_MCP_URL || `http://localhost:${MCP_PORT}`;

console.log('='.repeat(72));
console.log('YFAgent 真机端到端场景测试');
console.log('='.repeat(72));

if (process.env.YF_LIVE !== '1') {
  console.error('[FATAL] 未启用真机测试。请设置 YF_LIVE=1');
  process.exit(1);
}
if (!process.env.YF_USER_TOKEN) {
  console.error('[FATAL] 缺少 YF_USER_TOKEN（ERP 身份令牌，禁止写入仓库）');
  process.exit(1);
}

let health;
try {
  health = await fetch(`${MCP_URL}/health`).then((r) => r.json());
} catch (err) {
  console.error(`[FATAL] MCP /health 不可达（${MCP_URL}）：${err}`);
  console.error('        请确认 4001 端口上的 yfcli-mcp 服务已启动。');
  process.exit(2);
}
console.log(`[1] /health → status=${health.status} tools=${health.tools} erp=${health.erp}`);
if (health.tools !== 24) console.warn(`[WARN] 期望注册 24 个工具，实测 ${health.tools}`);

// ---------------------------------------------------------------- 清空旧侧车

mkdirSync(sidecarDir, { recursive: true });
for (const f of readdirSync(sidecarDir)) {
  if (f.endsWith('.json')) writeFileSync(resolve(sidecarDir, f), '', 'utf-8');
}

// ---------------------------------------------------------------- 执行 vitest

const startedAt = new Date();
const testTimeout = process.env.YF_LIVE_TEST_TIMEOUT || '60000';

console.log(`[2] 启动 vitest（config=vitest.live.config.ts，testTimeout=${testTimeout}ms）`);
console.log('');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vitest', 'run', '--config', 'vitest.live.config.ts', '--reporter=verbose'],
  {
    cwd: mcpDir,
    stdio: 'inherit',
    env: { ...process.env, YF_LIVE: '1', YF_LIVE_TEST_TIMEOUT: testTimeout, YF_LIVE_RUN_STARTED_AT: startedAt.toISOString() },
    shell: process.platform === 'win32',
  },
);

const exitCode = await new Promise((res) => { child.on('close', (code) => res(code ?? 1)); });

// ---------------------------------------------------------------- 汇总报告

console.log('');
console.log('[3] 汇总侧车结果并生成报告');

const scenarios = [];
const residual = [];
const defects = [];
let files = 0;

for (const name of readdirSync(sidecarDir).filter((n) => n.endsWith('.json'))) {
  const text = readFileSync(resolve(sidecarDir, name), 'utf-8').trim();
  if (!text) continue;
  try {
    const parsed = JSON.parse(text);
    files += 1;
    if (Array.isArray(parsed.scenarios)) scenarios.push(...parsed.scenarios);
    if (Array.isArray(parsed.residual)) residual.push(...parsed.residual);
    if (Array.isArray(parsed.defects)) defects.push(...parsed.defects);
  } catch {
    console.warn(`[WARN] 侧车文件解析失败：${name}`);
  }
}

const pass = scenarios.filter((s) => s.verdict === 'PASS').length;
const warn = scenarios.filter((s) => s.verdict === 'WARN').length;
const fail = scenarios.filter((s) => s.verdict === 'FAIL').length;
const objects = new Set(scenarios.map((s) => s.object));
const finishedAt = new Date();

const cell = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const icon = (v) => (v === 'PASS' ? '✅ PASS' : v === 'FAIL' ? '❌ FAIL' : '⚠️ WARN');

const L = [];
L.push('# YFAgent 真机端到端场景测试报告');
L.push('');
L.push(`- 执行时间：${startedAt.toISOString()} ~ ${finishedAt.toISOString()}`);
L.push(`- MCP 通道：${MCP_URL}/mcp（Bearer token + Accept: application/json, text/event-stream）`);
L.push(`- 账套：${process.env.YF_COMPANY_ID || '（未设置）'}`);
L.push(`- 侧车文件：${files} 个 [口径：runs/.live-sidecar/ 下非空 *.json 计数]`);
L.push(`- 知识产物：知识产物由 npm run check:all 校验`);
L.push('');
L.push('## 一、结论汇总');
L.push('');
L.push(`- 场景总数 **${scenarios.length}** [口径：已执行并记录的场景数]，覆盖对象 **${objects.size}** [口径：type_key 去重]`);
L.push(`- ✅ PASS ${pass} ｜ ⚠️ WARN ${warn} ｜ ❌ FAIL ${fail}`);
L.push(`- 总耗时 ${((finishedAt - startedAt) / 1000).toFixed(1)}s`);
L.push(`- 通过判据：**无 ❌ FAIL**（⚠️ WARN 允许并逐条说明原因）→ ${fail === 0 ? '**满足**' : '**不满足**'}`);
L.push('');
L.push('## 二、场景矩阵');
L.push('');
L.push('| 场景 | 对象 | 操作 | 预期 | 实测 | 结论 | 耗时(ms) | 备注 |');
L.push('|---|---|---|---|---|---|---|---|');
for (const s of scenarios) {
  L.push(`| ${cell(s.scenario)} | ${cell(s.object)} | ${cell(s.operation)} | ${cell(s.expected)} | ${cell(s.actual)} | ${icon(s.verdict)} | ${s.elapsedMs} | ${cell(s.note)} |`);
}
L.push('');
L.push('### 各域覆盖');
L.push('');
for (const domain of ['主数据', '单据', '问数', '归因', '降级']) {
  const inD = scenarios.filter((s) => String(s.scenario).startsWith(domain));
  if (!inD.length) continue;
  L.push(`- **${domain}**：${inD.length} 场景（✅${inD.filter((s) => s.verdict === 'PASS').length} ⚠️${inD.filter((s) => s.verdict === 'WARN').length} ❌${inD.filter((s) => s.verdict === 'FAIL').length}）`);
}
L.push('');
L.push('## 三、发现的缺陷');
L.push('');
if (!defects.length) {
  L.push('本轮未登记缺陷。');
} else {
  L.push('| # | 严重度 | 标题 | 场景 | 详情 |');
  L.push('|---|---|---|---|---|');
  defects.forEach((d, i) => L.push(`| ${i + 1} | ${cell(d.severity)} | ${cell(d.title)} | ${cell(d.scenario)} | ${cell(d.detail)} |`));
}
L.push('');
L.push('## 四、残留测试数据清单');
L.push('');
L.push('> 按既定策略**不清理、只标记**。以下数据保留在账套中，供人工决定是否删除。');
L.push('');
if (!residual.length) {
  L.push('无残留（本轮未产生新增数据）。');
} else {
  L.push(`共 **${residual.length}** 笔 [口径：create 成功且未删除的记录数]。`);
  L.push('');
  L.push('| 对象 | 主键 | 说明 |');
  L.push('|---|---|---|');
  for (const r of residual) L.push(`| ${cell(r.object)} | ${cell(JSON.stringify(r.primaryKey))} | ${cell(r.reason)} |`);
}
L.push('');
L.push('---');
L.push('');
L.push('> 本报告由 `scripts/run-live-e2e.mjs` 汇总侧车结果自动生成。');
L.push('> 报告中不含凭证原文、内网 IP 与令牌。');
L.push('');

const stamp = `${finishedAt.getFullYear()}${String(finishedAt.getMonth() + 1).padStart(2, '0')}${String(finishedAt.getDate()).padStart(2, '0')}`;
const reportAbs = resolve(root, 'runs', `e2e-${stamp}.md`);
writeFileSync(reportAbs, L.join(CRLF), 'utf-8');

console.log(`    报告：${reportAbs}`);
console.log(`    场景 ${scenarios.length} ｜ ✅${pass} ⚠️${warn} ❌${fail} ｜ 对象 ${objects.size} ｜ 缺陷 ${defects.length} ｜ 残留 ${residual.length}`);
console.log('');
console.log(`完成。vitest 退出码 = ${exitCode}`);
process.exit(exitCode);