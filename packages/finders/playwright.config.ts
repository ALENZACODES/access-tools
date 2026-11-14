import { defineConfig, devices } from "playwright/test";

/** Browser checks for the washroom and parking finders, run against this package's demo. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
    baseURL: "http://127.0.0.1:5181",
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 5181 --strictPort",
    cwd: new URL(".", import.meta.url).pathname,
    url: "http://127.0.0.1:5181",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
