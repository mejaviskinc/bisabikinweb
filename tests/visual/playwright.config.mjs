import {defineConfig} from '@playwright/test';

// Keep the baseline and candidate on the same OS, font stack and Chromium version.
// The CI script chooses which HTTP server to inspect via PLAYWRIGHT_BASE_URL.
export default defineConfig({
  testDir: '.',
  testMatch: /\.spec\.mjs$/,
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    locale: 'id-ID',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  expect: {
    timeout: 12000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.006,
      threshold: 0.12
    }
  },
  projects: [
    {name: 'desktop', use: {browserName: 'chromium', viewport: {width: 1440, height: 900}, deviceScaleFactor: 1}},
    {name: 'mobile', use: {browserName: 'chromium', viewport: {width: 390, height: 844}, deviceScaleFactor: 1, isMobile: true, hasTouch: true}}
  ]
});
