/**
 * 场景结果侧车文件 —— 解决 vitest 按文件隔离进程、无法共享内存收集器的问题。
 *
 * 每个 live 测试文件在 afterAll 把本文件的结果写入
 * `runs/.live-sidecar/<tag>.json`；报告生成器汇总这些侧车文件。
 * 目录位于 runs/ 下（已 gitignore），不污染仓库。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SIDECAR_PATH } from './helpers.js';
import type { ScenarioResult, ResidualRecord, DefectRecord } from './helpers.js';

export { SIDECAR_PATH };

export interface SidecarPayload {
  scenarios: ScenarioResult[];
  residual: ResidualRecord[];
  defects: DefectRecord[];
}

/** 把某个 live 文件的结果写入侧车（覆盖式，同一文件每次运行只留最新）。 */
export function writeSidecar(fileTag: string, payload: SidecarPayload): void {
  mkdirSync(SIDECAR_PATH, { recursive: true });
  const safe = fileTag.replace(/[^A-Za-z0-9_.-]/g, '_');
  writeFileSync(resolve(SIDECAR_PATH, `${safe}.json`), JSON.stringify(payload, null, 2), 'utf-8');
}