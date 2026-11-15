import { fileURLToPath } from "node:url";
import { defineConfig } from "playwright/test";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const port = 4179;

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: packageRoot,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
