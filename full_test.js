const { spawn } = require("child_process");
const { chromium } = require("playwright");
const path = require("path");

const ROOT = "D:\\???\\??\\????\\lucky-shop";

// Start backend
const backend = spawn("cmd.exe", ["/c", "cd /d " + ROOT + "\\server && " + ROOT + "\\node_modules\\.bin\\tsx.cmd src/index.ts"], {
  cwd: ROOT + "\\server",
  stdio: "pipe"
});
backend.stdout.on("data", d => process.stdout.write("[BK] " + d));
backend.stderr.on("data", d => process.stderr.write("[BK_ERR] " + d));

// Start frontend
const frontend = spawn("cmd.exe", ["/c", "cd /d " + ROOT + "\\client && " + ROOT + "\\node_modules\\.bin\\vite.cmd"], {
  cwd: ROOT + "\\client",
  stdio: "pipe"
});
frontend.stdout.on("data", d => process.stdout.write("[FE] " + d));
frontend.stderr.on("data", d => process.stderr.write("[FE_ERR] " + d));

// Wait for both servers
async function waitForServer(url, maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch(e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

(async () => {
  console.log("Waiting for servers...");
  const bkOk = await waitForServer("http://localhost:4000/api/health", 20);
  const feOk = await waitForServer("http://localhost:5173", 20);
  console.log("Backend: " + bkOk + " | Frontend: " + feOk);

  if (!bkOk || !feOk) {
    console.log("Servers failed to start");
    backend.kill(); frontend.kill();
    process.exit(1);
  }

  // Run Playwright tests
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
  ];

  for (const [name, url] of urls) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: "networkidle" });
      const title = await page.title();
      console.log("PASS [" + name + "]: " + title);
      pass++;
    } catch(e) {
      console.log("FAIL [" + name + "]: " + e.message.substring(0, 80));
      fail++;
    }
  }

  await browser.close();
  console.log("\n=== Frontend Smoke: " + pass + "/" + (pass+fail) + " ===");

  backend.kill(); frontend.kill();
  process.exit(fail > 0 ? 1 : 0);
})();