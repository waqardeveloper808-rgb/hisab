import { chromium, devices } from 'playwright';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const outputDir = path.resolve('qa_reports/frontend-proof');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

const captures = [
  {
    name: 'next-homepage-full',
    url: 'http://127.0.0.1:3011',
    viewport: { width: 1440, height: 2200 },
    fullPage: true,
  },
  {
    name: 'next-navbar-hero',
    url: 'http://127.0.0.1:3011',
    viewport: { width: 1440, height: 1100 },
    fullPage: false,
  },
  {
    name: 'next-homepage-mobile',
    url: 'http://127.0.0.1:3011',
    device: devices['iPhone 14'],
    fullPage: true,
  },
  {
    name: 'backend-blade-home',
    url: 'http://127.0.0.1:8011',
    viewport: { width: 1440, height: 2200 },
    fullPage: true,
  },
];

for (const capture of captures) {
  const context = capture.device
    ? await browser.newContext({ ...capture.device })
    : await browser.newContext({ viewport: capture.viewport });
  const page = await context.newPage();
  await page.goto(capture.url, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.join(outputDir, `${capture.name}.png`),
    fullPage: capture.fullPage,
  });
  console.log(`captured ${capture.name}: ${await page.title()}`);
  await context.close();
}

await browser.close();
