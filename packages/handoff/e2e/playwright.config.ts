import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4179", browserName: "chromium" },
  webServer: {
    command: "npm run dev -- --port 4179 --strictPort",
    url: "http://127.0.0.1:4179",
    cwd: new URL("..", import.meta.url).pathname,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
