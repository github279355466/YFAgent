/**
 * 真机测试 global setup —— 负责在全部用例跑完后写出报告。
 *
 * vitest 的 globalSetup 默认在独立上下文运行，无法访问测试内模块状态，
 * 因此这里改为「只注册环境标记」；报告改由 report-writer 用例在最后写出
 * （见 live-report.live.test.ts）。
 *
 * 本文件保留为将来接入 vitest reporter 的挂载点。
 */

export async function setup(): Promise<void> {
  process.env['YF_LIVE_RUN_STARTED_AT'] = new Date().toISOString();
}

export async function teardown(): Promise<void> {
  // 报告写出由 live-report.live.test.ts 负责（同进程，可访问收集器）
}