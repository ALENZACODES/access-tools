import { defineConfig } from "playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "*.spec.ts", timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4178" },
  webServer: { command: "npm run demo -- --port 4178 --strictPort", url: "http://127.0.0.1:4178", reuseExistingServer: true, timeout: 30000 },
});
