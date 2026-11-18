import { defineConfig } from '@playwright/test'

// End-to-end: the real server (with a throwaway Postgres) + the production client build, in Chromium.
// CI: .github/workflows/ci.yml → e2e job. Locally: build server and client first, then `npm test` here
// with DATABASE_URL pointing at a THROWAWAY database (the tests create users and rooms).
const API = 'http://localhost:3001'
const WEB = 'http://localhost:4173'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: WEB, trace: 'retain-on-failure', screenshot: 'only-on-failure', viewport: { width: 1280, height: 800 } },
  webServer: [
    {
      command: 'node dist/index.js',
      cwd: '../server',
      url: `${API}/ping`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: '3001',
        CLIENT_URL: WEB,
        SERVER_URL: API,
        JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-secret',
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
    },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      cwd: '../client',
      url: WEB,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
