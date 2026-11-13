import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/test/**/*.test.ts", "packages/*/test/**/*.test.tsx"],
    restoreMocks: true,
  },
});
