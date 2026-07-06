import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

// .next/standalone/server.js runs `process.chdir(__dirname)` on startup, so
// once it's running, its cwd is .next/standalone/ - not wherever `npm run
// test:e2e` was invoked from. A relative `file:` sqlite URL (e.g.
// file:./prisma/dev.db, matching what the earlier migrate+seed step already
// populated) would then resolve against .next/standalone/prisma/dev.db,
// which doesn't exist there, instead of the real database file. Resolving
// it to an absolute path here - before that chdir ever happens - sidesteps
// that entirely. (Fly production doesn't hit this: fly.toml already sets an
// absolute DATABASE_URL.)
const databaseUrl = process.env.DATABASE_URL;
const ciDatabaseUrl = databaseUrl?.startsWith('file:./')
  ? `file:${path.resolve(process.cwd(), databaseUrl.slice('file:./'.length)).replace(/\\/g, '/')}`
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
