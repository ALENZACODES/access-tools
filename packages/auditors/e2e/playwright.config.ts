import { defineConfig } from "playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4189", viewport: { width: 1280, height: 800 } },
  webServer: { command: "npm run demo -- --port 4189 --strictPort", url: "http://127.0.0.1:4189", timeout: 30000, reuseExistingServer: !process.env.CI },
});
