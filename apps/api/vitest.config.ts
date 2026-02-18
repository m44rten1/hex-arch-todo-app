import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@todo/core": path.resolve(import.meta.dirname, "../../packages/core/src"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
