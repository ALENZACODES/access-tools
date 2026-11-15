import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4187", browserName: "chromium" },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4187 --strictPort packages/tile-cache",
    url: "http://127.0.0.1:4187/demo.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
