import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Unit coverage covers all logic. Next.js route files (src/app) and the
      // vendored shadcn primitives (src/components/ui) are tested through the
      // screens that use them, in Playwright with axe, plus the rules in
      // tests/unit/theme (docs/adr/1-stack-and-decisions.md).
      include: ["src/**/*.{ts,tsx}", ".claude/hooks/**/*.mjs"],
      exclude: ["src/app/**", "src/components/ui/**", "**/*.d.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        "src/domain/**": {
          lines: 95,
          functions: 95,
          branches: 95,
          statements: 95,
        },
      },
    },
  },
});
