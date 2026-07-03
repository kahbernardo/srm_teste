import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Nova Operação', { timeout: 20000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'docs/screenshots/dashboard-preview.png', fullPage: true });

await page.goto('http://localhost:4000/docs', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'docs/screenshots/swagger-api.png' });

await browser.close();
console.log('screenshots captured');
