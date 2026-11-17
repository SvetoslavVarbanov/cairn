// @ts-check
/**
 * PreToolUse hook for Read, Grep, Edit, Write, MultiEdit and NotebookEdit:
 * refuses to open or change `.env` files in any folder, where secrets live
 * (SPEC 3.8). `.env.example` is fine. If the hook itself fails, the tool call
 * is blocked.
 */
import {
  BLOCK_PREFIX,
  asRecord,
  globCouldMatchEnvFile,
  isMain,
  isSecretEnvFile,
  parseHookInput,
  readStdin,
} from "./lib.mjs";

const PREFIX = BLOCK_PREFIX;

/**
 * True for a search filter such as `.env` or `.env*` that picks env files.
 * @param {unknown} glob
 */
function globPicksEnvFiles(glob) {
  if (typeof glob !== "string") return false;
  return isSecretEnvFile(glob) || globCouldMatchEnvFile(glob);
}

/**
 * @param {Record<string, unknown>} input hook input from Claude Code
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function checkFileAccess(input) {
  const toolInput = asRecord(input.tool_input);
  const targets = [
    toolInput.file_path,
    toolInput.notebook_path,
    toolInput.path,
  ];
  const secret =
    targets.some(
      (target) => typeof target === "string" && isSecretEnvFile(target),
    ) || globPicksEnvFiles(toolInput.glob);
  if (secret) {
    return {
      blocked: true,
      reason:
        `${PREFIX}.env files hold secrets, so Claude does not read or change ` +
        "them. Put placeholder names in .env.example instead and give the " +
        "owner step-by-step instructions.",
    };
  }
  return { blocked: false };
}

if (isMain(import.meta.url)) {
  try {
    const result = checkFileAccess(parseHookInput(await readStdin()));
    if (result.blocked) {
      process.stderr.write(`${result.reason}\n`);
      process.exit(2);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `${PREFIX}the hook could not check this file, so it was stopped to be ` +
        `safe. Tell the owner; the problem is in .claude/hooks/. (${detail})\n`,
    );
    process.exit(2);
  }
}
