const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  const response = await page.goto('http://127.0.0.1:8765/', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  if (!response?.ok()) throw new Error('Homepage did not load');

  await page.waitForSelector('#map .leaflet-marker-icon', { timeout: 20000 });
  const markerCount = await page.locator('#map .leaflet-marker-icon').count();
  if (markerCount < 1) throw new Error('No map markers loaded');

  const firstMarker = page.locator('#map .leaflet-marker-icon').first();
  await firstMarker.click({ force: true });
  await page.waitForTimeout(500);
  if (!(await page.locator('#detail .institutionProfile').count())) {
    throw new Error('Clicking a marker did not open an institution profile');
  }

  const save = page.locator('#detail [data-save-id]');
  if (!(await save.count())) throw new Error('My Atlas button missing');
  await save.click();
  if (!(await page.locator('#detail [data-save-id]').count())) {
    throw new Error('My Atlas button disappeared after saving');
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: '/tmp/atlas-mobile.png', fullPage: true });
  if (errors.length) throw new Error('JavaScript errors: ' + errors.join(' | '));

  console.log('Smoke test passed; markers visible:', markerCount);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
