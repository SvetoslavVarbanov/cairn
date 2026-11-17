// @ts-check
/**
 * Stop hook: when a turn ends with code changes, runs the typecheck and lint
 * and reports the result to the owner (SPEC 3.8). It only reports: it never
 * makes Claude keep going, so it cannot cause a loop.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { isMain, parseInput, readStdin } from "./lib.mjs";

const CODE_FILE =
  /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$|(^|[\\/])(package\.json|tsconfig\.json)$/;

/**
 * Paths from `git status --porcelain` output.
 * @param {string} porcelain
 */
export function changedPaths(porcelain) {
  return porcelain
    .split(/\r?\n/)
    .filter((line) => line.length > 3)
    .map((line) => {
      const path = line.slice(3);
      const arrow = path.indexOf(" -> ");
      return (arrow === -1 ? path : path.slice(arrow + 4)).replace(
        /^"|"$/g,
        "",
      );
    });
}

/**
 * A folder entry such as `src/domain/` may hold code, so it counts too.
 * @param {{ stopHookActive: boolean, hasNodeModules: boolean, changed: string[] }} state
 */
export function shouldRun({ stopHookActive, hasNodeModules, changed }) {
  if (stopHookActive || !hasNodeModules) return false;
  return changed.some((path) => CODE_FILE.test(path) || path.endsWith("/"));
}

/**
 * @param {{ name: string, ok: boolean }[]} results
 */
export function summarize(results) {
  const parts = results.map((r) =>
    r.ok ? `${r.name} passed` : `${r.name} FAILED (run "npm run ${r.name}")`,
  );
  return `Cairn checks after this turn: ${parts.join(", ")}.`;
}

const SCRIPTS = /** @type {const} */ (["typecheck", "lint"]);

/**
 * Runs one of the fixed npm scripts. npm needs a shell on Windows; the
 * command text is a constant, so nothing from outside reaches the shell.
 * @param {string} cwd
 * @param {(typeof SCRIPTS)[number]} script
 */
function npmRun(cwd, script) {
  const result = spawnSync(`npm run --silent ${script}`, {
    cwd,
    encoding: "utf8",
    shell: true,
    timeout: 240_000,
  });
  return result.status === 0;
}

if (isMain(import.meta.url)) {
  const input = parseInput(await readStdin());
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR ??
    (typeof input.cwd === "string" ? input.cwd : process.cwd());
  // --untracked-files=all lists the files inside a new folder one by one.
  const status = spawnSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd: projectDir, encoding: "utf8" },
  );

  const run = shouldRun({
    stopHookActive: input.stop_hook_active === true,
    hasNodeModules: existsSync(join(projectDir, "node_modules")),
    changed: changedPaths(status.stdout ?? ""),
  });

  if (run) {
    const results = SCRIPTS.map((name) => ({
      name,
      ok: npmRun(projectDir, name),
    }));
    process.stdout.write(JSON.stringify({ systemMessage: summarize(results) }));
  }
}
