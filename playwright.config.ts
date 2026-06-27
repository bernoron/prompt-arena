import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const databaseUrl = process.env.DATABASE_URL;
const ciDatabaseUrl = databaseUrl?.startsWith('file:./')
  ? `file:${path.resolve(process.cwd(), 'prisma', databaseUrl.slice('file:./'.length)).replace(/\\/g, '/')}`
  : databaseUrl;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    // CI: use production standalone build (already built in CI step) - deterministic, no JIT delays
    // Local: reuse running dev server
    command: process.env.CI ? 'node .next/standalone/server.js' : 'npm run dev',
    env: process.env.CI && ciDatabaseUrl ? { DATABASE_URL: ciDatabaseUrl } : undefined,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
