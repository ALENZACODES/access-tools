import { defineConfig, devices } from "playwright/test";

const browser = {
  ...devices["Desktop Chrome"],
  ...(process.env.CI ? {} : { channel: "chrome" as const }),
};

/**
 * One run for the harness specs in this folder and for the package demo specs
 * listed below. Each package project has its own demo server and port.
 * A package's own e2e/playwright.config.ts still runs that package alone.
 */
const PACKAGE_DEMOS = [
  { name: "employment", port: 4179, command: "npx vite --config packages/employment/vite.config.ts --host 127.0.0.1 --port 4179 --strictPort" },
  { name: "housing", port: 4178, command: "npm run demo -w packages/housing -- --port 4178 --strictPort" },
  { name: "auditors", port: 4189, command: "npm run demo -w packages/auditors -- --port 4189 --strictPort" },
] as const;

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["./regression/reporter.ts"]],
  projects: [
    { name: "tools", testDir: ".", testMatch: "*.spec.ts", use: { ...browser, baseURL: "http://127.0.0.1:5173" } },
    ...PACKAGE_DEMOS.map((demo) => ({
      name: demo.name,
      testDir: `../packages/${demo.name}/e2e`,
      testMatch: "*.spec.ts",
      use: { ...browser, baseURL: `http://127.0.0.1:${demo.port}` },
    })),
  ],
  webServer: [
    {
      command: "npx vite --config e2e/harness/vite.config.ts",
      cwd: "..",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    ...PACKAGE_DEMOS.map((demo) => ({
      command: demo.command,
      cwd: "..",
      url: `http://127.0.0.1:${demo.port}`,
      reuseExistingServer: false,
      timeout: 60_000,
    })),
  ],
});
