/**
 * 占位文件 —— 报告不再由测试写出。
 *
 * 原因：vitest 按文件隔离进程且执行顺序不保证，测试内无法汇总其它文件的侧车结果。
 * 报告改由 `scripts/run-live-e2e.mjs` 在 vitest 退出后汇总 runs/.live-sidecar/*.json 生成。
 *
 * 本文件保留为空套件（vitest 要求每个匹配的测试文件至少有一个用例）。
 */

import { describe, it, expect } from 'vitest';

describe('report-writer（占位）', () => {
  it('报告由 run-live-e2e.mjs 汇总侧车生成', () => {
    expect(true).toBe(true);
  });
});