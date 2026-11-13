import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
    baseURL: "http://127.0.0.1:5173",
  },
  webServer: {
    command: "npx vite --config e2e/harness/vite.config.ts",
    cwd: "..",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
