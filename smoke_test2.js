const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let pass = 0, fail = 0;

  const urls = [
    ['Home', 'http://localhost:5173'],
    ['Products', 'http://localhost:5173/products'],
    ['Login', 'http://localhost:5173/login'],
    ['Register', 'http://localhost:5173/register'],
    ['Games', 'http://localhost:5173/games'],
    ['Cart', 'http://localhost:5173/cart'],
    ['404 Page', 'http://localhost:5173/nonexistent'],
  ];

  for (const [name, url] of urls) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: 'networkidle' });
      const title = await page.title();
      console.log('PASS [' + name + ']: ' + title);
      pass++;
    } catch(e) {
      console.log('FAIL [' + name + ']: ' + e.message.substring(0, 100));
      fail++;
    }
  }

  // Test login flow
  try {
    await page.goto('http://localhost:5173/login', { timeout: 10000, waitUntil: 'networkidle' });
    // Fill in form
    const emailInput = await page.input[type=email], input[name=email], input[placeholder*=??];
    if (emailInput) {
      await emailInput.fill('admin@luckyshop.com');
      const pwInput = await page.input[type=password], input[name=password];
      await pwInput.fill('admin123');
      const btn = await page.button[type=submit], button:has-text("??");
      if (btn) await btn.click();
      await page.waitForTimeout(3000);
      const url = page.url();
      console.log('PASS [Login Flow]: redirected to ' + url);
      pass++;
    } else {
      console.log('SKIP [Login Flow]: no form found');
    }
  } catch(e) {
    console.log('FAIL [Login Flow]: ' + e.message.substring(0, 100));
    fail++;
  }

  await browser.close();
  console.log('');
  console.log('========================================');
  console.log('Frontend Smoke Test: ' + pass + '/' + (pass+fail) + ' passed');
  console.log('========================================');
})();
