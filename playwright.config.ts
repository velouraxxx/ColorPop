import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:3002", headless: true },
  workers: 1,
  webServer: {
    command: "PORT=3002 NODE_ENV=production node server/index.mjs",
    url: "http://127.0.0.1:3002/api/health",
    reuseExistingServer: false,
  },
});
