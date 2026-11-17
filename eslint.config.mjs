import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

const eslintConfig = defineConfig([
  // Next.js rules, including React, react-hooks, import and jsx-a11y plugins.
  ...nextVitals,
  ...nextTs,

  // Stricter accessibility rules. The jsx-a11y plugin is already registered
  // by eslint-config-next, so only the rules are added here.
  {
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.strict.rules,
  },

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Claude Code hooks are plain Node scripts that talk over stdin/stdout.
  {
    files: [".claude/hooks/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" },
  },

  // Turn off style rules that Prettier handles. Must stay last.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "docs/private/**",
    "next-env.d.ts",
    "public/sw.js",
  ]),
]);

export default eslintConfig;
