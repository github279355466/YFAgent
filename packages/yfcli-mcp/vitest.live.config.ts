import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 真机测试专用 vitest 配置。
 *
 * 与 vitest.config.ts 的差异：
 *   - include 只匹配 __tests__/live 下的 live.test.ts（离线套件不含 live 用例）
 *   - testTimeout 放宽到 60s（易飞无 fastquery，每次查询重查数据库）
 *   - 文件串行执行（避免账套侧并发写冲突）
 *   - 主动载入仓库根 .env（凭证只来自本地文件，禁止写死进仓库）
 *
 * 该配置只在 YF_LIVE=1 时被使用（scripts/run-live-e2e.mjs 显式指定）。
 */

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
  console.error(`[vitest.live] Loaded env from ${envPath}`);
}

const timeout = parseInt(process.env['YF_LIVE_TEST_TIMEOUT'] ?? '60000', 10);

export default defineConfig({
  test: {
    globals: false,
    include: ['__tests__/live/**/*.live.test.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});