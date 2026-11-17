// @ts-check
/**
 * PostToolUse hook for Edit, Write and MultiEdit: formats the edited file
 * with Prettier and applies `eslint --fix` (SPEC 3.8). Problems ESLint
 * cannot fix are sent back to Claude (exit code 2) so they get fixed now.
 * Files outside the project (for example Claude's own notes) are left alone.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";

import {
  asRecord,
  isInsideProject,
  isMain,
  parseInput,
  readStdin,
} from "./lib.mjs";

const PRETTIER_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
]);
const ESLINT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);
const SKIPPED_FOLDERS = /(^|[\\/])(node_modules|\.next|docs[\\/]private)[\\/]/;
const NOTHING = { prettier: false, eslint: false };

/**
 * Which tools should run on a file.
 * @param {string} filePath
 * @param {string} projectDir
 */
export function planFormatting(filePath, projectDir) {
  if (!isInsideProject(filePath, projectDir)) return NOTHING;
  if (SKIPPED_FOLDERS.test(filePath)) return NOTHING;
  const ext = extname(filePath).toLowerCase();
  return {
    prettier: PRETTIER_EXTENSIONS.has(ext),
    eslint: ESLINT_EXTENSIONS.has(ext),
  };
}

/**
 * @param {string} projectDir
 * @param {string[]} args
 */
function runNode(projectDir, args) {
  return spawnSync(process.execPath, args, {
    cwd: projectDir,
    encoding: "utf8",
    timeout: 45_000,
  });
}

if (isMain(import.meta.url)) {
  const input = parseInput(await readStdin());
  const filePath = asRecord(input.tool_input).file_path;
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR ??
    (typeof input.cwd === "string" ? input.cwd : process.cwd());
  const prettierBin = join(
    projectDir,
    "node_modules/prettier/bin/prettier.cjs",
  );
  const eslintBin = join(projectDir, "node_modules/eslint/bin/eslint.js");

  if (typeof filePath === "string" && existsSync(filePath)) {
    const plan = planFormatting(filePath, projectDir);
    if (plan.prettier && existsSync(prettierBin)) {
      runNode(projectDir, [
        prettierBin,
        "--write",
        "--ignore-unknown",
        "--log-level",
        "warn",
        filePath,
      ]);
    }
    if (plan.eslint && existsSync(eslintBin)) {
      const lint = runNode(projectDir, [
        eslintBin,
        "--fix",
        "--no-warn-ignored",
        filePath,
      ]);
      if (lint.status !== 0) {
        process.stderr.write(
          `ESLint found problems it could not fix in ${filePath}:\n` +
            `${lint.stdout}${lint.stderr}`,
        );
        process.exit(2);
      }
    }
  }
}
