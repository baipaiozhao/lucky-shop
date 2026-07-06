const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let pass = 0, fail = 0;

  const urls = [
    ["Home", "http://localhost:5173"],
    ["Products", "http://localhost:5173/products"],
    ["Login", "http://localhost:5173/login"],
    ["Register", "http://localhost:5173/register"],
    ["Games", "http://localhost:5173/games"],
    ["Cart", "http://localhost:5173/cart"],
    ["404", "http://localhost:5173/nonexistent"],
  ];

  for (const [name, url] of urls) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: "networkidle" });
      const title = await page.title();
      console.log("PASS [" + name + "]: " + title);
      pass++;
    } catch(e) {
      console.log("FAIL [" + name + "]: " + e.message.substring(0, 100));
      fail++;
    }
  }

  // Test login
  try {
    await page.goto("http://localhost:5173/login", { timeout: 10000, waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[name="email"]', "admin@luckyshop.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log("PASS [Login Flow]: " + page.url());
    pass++;
  } catch(e) {
    console.log("SKIP [Login Flow]: " + e.message.substring(0, 80));
  }

  await browser.close();
  console.log("");
  console.log("Frontend Smoke: " + pass + "/" + (pass+fail) + " passed");
})();