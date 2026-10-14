const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error('Home page failed');
  await page.waitForTimeout(5000);
  if(!(await page.locator('#map').count()))throw Error('Map missing');
  if(!(await page.locator('#detail').count()))throw Error('Detail panel missing');
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'/tmp/atlas-mobile.png',fullPage:true});
  await browser.close();
  console.log('ATLAS ELE smoke test passed');
})().catch(e=>{console.error(e);process.exit(1)});
