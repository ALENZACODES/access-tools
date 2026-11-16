import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4179" },
  webServer: {
    // Runs from the package folder, where vite.config.ts sets the demo root.
    command: "npx vite --config vite.config.ts --host 127.0.0.1 --port 4179 --strictPort",
    cwd: "..",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
