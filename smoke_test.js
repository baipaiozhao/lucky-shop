const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  const urls = [
    ['Home', 'http://localhost:5173'],
    ['Products', 'http://localhost:5173/products'],
    ['Login', 'http://localhost:5173/login'],
    ['Register', 'http://localhost:5173/register'],
    ['Games', 'http://localhost:5173/games'],
    ['Cart', 'http://localhost:5173/cart'],
    ['404', 'http://localhost:5173/nonexistent'],
  ];

  for (const [name, url] of urls) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: 'networkidle' });
      const title = await page.title();
      results.push('? ' + name + ': "' + title + '"');
    } catch(e) {
      results.push('? ' + name + ': ' + e.message.substring(0, 80));
    }
  }

  await browser.close();
  results.forEach(r => console.log(r));
  console.log('\n' + results.filter(r => r.startsWith('?')).length + '/' + results.length + ' pages accessible');
})();
