import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4179" },
  webServer: {
    command: "npx vite packages/employment --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
