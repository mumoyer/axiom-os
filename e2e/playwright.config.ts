import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

// Resolve pre-installed Chromium in $LOCALAPPDATA\ms-playwright\chromium-1200
const localAppData = process.env.LOCALAPPDATA || '';
const localChromium = path.join(
  localAppData,
  'ms-playwright',
  'chromium-1200',
  'chrome-win64',
  'chrome.exe'
);
const chromiumExecutable = fs.existsSync(localChromium) ? localChromium : undefined;

export default defineConfig({
  testDir: './',
  testMatch: /.*\.spec\.ts/,
  timeout: 30000,
  expect: {
    timeout: 8000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3005',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    screenshot: 'off',
    trace: 'off',
    launchOptions: {
      executablePath: chromiumExecutable,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: chromiumExecutable,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        },
      },
    },
  ],
  webServer: {
    command: 'npx tsx server/index.ts',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://localhost:3005/api/healthz',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
