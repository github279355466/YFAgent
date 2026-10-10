import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['__tests__/**/*.test.ts'],
    // 真机用例（*.live.test.ts）必须显式排除，保证 npm test / CI 不连网。
    // 真机入口：npm run test:live（走 vitest.live.config.ts）
    exclude: ['**/node_modules/**', '**/dist/**', '__tests__/live/**'],
    testTimeout: 10000,
  },
});