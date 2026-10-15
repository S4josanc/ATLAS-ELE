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

  // Cluster icons may represent multiple institutions; choose a single marker.
  const individual = page.locator('#map .leaflet-marker-icon:not(.marker-cluster)');
  const firstMarker = (await individual.count()) ? individual.first() : page.locator('#map .leaflet-marker-icon').first();
  await firstMarker.click({ force: true });
  await page.waitForTimeout(500);
  if (!(await page.locator('#detail .institutionProfile').count())) {
    throw new Error('Clicking a marker did not open an institution profile');
  }

  const save = page.locator('#detail [data-save-id]');
  if (!(await save.count())) throw new Error('My Atlas button missing');
  const recordId = await save.getAttribute('data-save-id');
  await save.click();
  const savedIds = await page.evaluate(() => JSON.parse(localStorage.getItem('atlasSaved') || '[]'));
  if (!savedIds.includes(recordId)) throw new Error('My Atlas did not save record ID');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#map .leaflet-marker-icon', { timeout: 20000 });
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('atlasSaved') || '[]'));
  if (!persisted.includes(recordId)) throw new Error('My Atlas favorite did not persist across reload');

  // Verify that the evidence registry is present and attached to matching loaded records.
  const evidenceCheck = await page.evaluate(() => {
    const registry = window.ATLAS_VERIFICATION_EVIDENCE || {};
    const expected = ['UK-MASTER-0011', 'UK-MASTER-0013', 'UK-MASTER-0014'];
    return expected.every(id => registry[id]?.spanishProgramEvidenceUrl?.startsWith('https://'));
  });
  if (!evidenceCheck) throw new Error('Evidence registry missing expected school references');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: '/tmp/atlas-mobile.png', fullPage: true });
  if (errors.length) throw new Error('JavaScript errors: ' + errors.join(' | '));

  console.log('Smoke test passed; markers visible:', markerCount);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
