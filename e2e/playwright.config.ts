import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4000",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
  webServer: {
    command: "npm run dev --workspace=server",
    url: "http://localhost:4000/api/health",
    timeout: 30000,
    reuseExistingServer: true,
    cwd: "..",
  },
});
