// @ts-check
/**
 * PreToolUse hook for Bash and PowerShell: blocks risky commands (SPEC 3.8).
 *
 * It is a safety net for honest mistakes, not a sandbox. It recognises the
 * common spellings of each risky command, including inside `bash -c "..."`,
 * `powershell -Command ...` and `cmd /c ...`, and errs on the side of
 * blocking when unsure. If the hook itself fails, the command is blocked.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import {
  BLOCK_PREFIX,
  asRecord,
  baseName,
  globCouldMatchEnvFile,
  isMain,
  isSecretEnvFile,
  parseHookInput,
  readStdin,
} from "./lib.mjs";

const PREFIX = BLOCK_PREFIX;

export const REASONS = {
  delete:
    "deleting a folder with everything in it (rm -r, Remove-Item -Recurse, " +
    "rd /s, rimraf and the like) is not allowed: nothing asks first and " +
    "there is no undo. Delete specific files, or ask the owner first.",
  clean:
    "git clean deletes files git does not track, including docs/private and " +
    ".env files, which have no other copy. Delete specific files, or ask the " +
    "owner first. A dry run (git clean -n) is fine.",
  noVerify:
    "skipping git's checks (--no-verify, commit -n) is not allowed. Fix what " +
    "the checks report instead.",
  forcePush:
    "force-pushing rewrites history and needs the owner's OK first. Ask " +
    "them, or push a new commit instead.",
  pushMain:
    "pushing to main is not allowed. Main only changes through pull " +
    "requests with green checks: push a branch and open a pull request.",
  dbReset:
    "resetting or dropping a remote database is not allowed. Only the owner " +
    "may do that, deliberately.",
  encoded:
    "encoded PowerShell commands can't be checked. Run the command as plain " +
    "text.",
  env:
    "reading or writing .env files from the shell is not allowed, because " +
    "they hold secrets. Use .env.example for placeholder names.",
  hookError:
    "the hook could not check this command, so it was stopped to be safe. " +
    "Tell the owner; the problem is in .claude/hooks/.",
};

/**
 * @typedef {object} Context
 * @property {string} cwd working directory of the command
 * @property {(cwd: string) => string} [getBranch] current git branch
 */

/**
 * Splits a command line into segments (at ; & | ( ) and line breaks), each a
 * list of tokens, honouring single and double quotes. Inside double quotes a
 * backslash only escapes `"`, `\`, `$` and a backtick, as in bash, so quoted
 * Windows paths such as "C:\Users\x\.env" keep their separators.
 * @param {string} command
 * @returns {string[][]}
 */
export function tokenize(command) {
  /** @type {string[][]} */
  const segments = [];
  /** @type {string[]} */
  let tokens = [];
  let current = "";
  let inToken = false;
  /** @type {string | null} */
  let quote = null;

  const endToken = () => {
    if (inToken) tokens.push(current);
    current = "";
    inToken = false;
  };
  const endSegment = () => {
    endToken();
    if (tokens.length > 0) segments.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < command.length; i++) {
    const ch = command.charAt(i);
    if (quote) {
      const next = command.charAt(i + 1);
      if (ch === quote) {
        quote = null;
      } else if (
        ch === "\\" &&
        quote === '"' &&
        '"\\$`'.includes(next) &&
        next
      ) {
        i++;
        current += next;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
    } else if (ch === "\n" || ch === "\r") {
      endSegment();
    } else if (/\s/.test(ch)) {
      endToken();
    } else if (";&|()`".includes(ch)) {
      // A backtick starts or ends `command substitution`, a command of its own.
      endSegment();
    } else {
      current += ch;
      inToken = true;
    }
  }
  endSegment();
  return segments;
}

/** @param {string} token */
function commandName(token) {
  return baseName(token)
    .toLowerCase()
    .replace(/\.exe$/, "");
}

const DELETE_COMMANDS = new Set([
  "rm",
  "remove-item",
  "ri",
  "del",
  "erase",
  "rd",
  "rmdir",
]);
const POSIX_SHELLS = new Set(["bash", "sh", "zsh", "dash"]);
const POWERSHELLS = new Set(["powershell", "pwsh"]);
const SCRIPT_RUNNERS = new Set([
  "node",
  "python",
  "python3",
  "py",
  "deno",
  "bun",
  "tsx",
  "ts-node",
  "npx",
  "bunx",
  "pnpx",
]);
// Words after which the next word is the program that runs, as in
// `npx rimraf x` or `npm exec rimraf x` (but not `npm uninstall rimraf`).
const RUN_PREFIXES = new Set(["npx", "bunx", "pnpx", "dlx", "exec", "sudo"]);

/**
 * True when the token at `i` is the program being run, not an argument.
 * @param {string[]} tokens
 * @param {number} i
 */
function runsAsCommand(tokens, i) {
  return i === 0 || RUN_PREFIXES.has(commandName(tokens[i - 1] ?? ""));
}
const DATABASE_TOOLS = new Set(["psql", "supabase"]);

// Code that deletes a folder tree, e.g. fs.rmSync(x, { recursive: true }) or
// Python's shutil.rmtree(x).
const RECURSIVE_DELETE_CODE =
  /\brm(?:dir)?(?:Sync)?\s*\([\s\S]*?\brecursive\s*:\s*true|\brmtree\s*\(/;
const DROP_DATABASE = /\bdrop\s+(database|schema)\b/i;

/**
 * True when the arguments ask rm, Remove-Item or cmd's rd/del to work
 * through every subfolder.
 * @param {string[]} args
 */
function isRecursiveDelete(args) {
  return args.some((raw) => {
    const arg = raw.toLowerCase();
    // cmd switches, alone or joined: /s, /s /q, /s/q.
    if (/^(\/[a-z])+$/.test(arg)) return arg.split("/").includes("s");
    if (arg === "--recursive") return true;
    // PowerShell -Recurse and its abbreviations, e.g. -Rec, -re.
    if (/^-re(c(u(r(se?)?)?)?)?(:.*)?$/.test(arg)) return true;
    // rm's short flag groups, e.g. -r, -rf, -iR. Only rm's own letters, so
    // PowerShell words such as -Filter or -Confirm are not read as -rf.
    return /^-[rfidv]+$/.test(arg) && arg.includes("r");
  });
}

/**
 * Checks the script passed to a nested shell.
 * @param {string} shell
 * @param {string[]} args
 * @param {Context} ctx
 * @returns {string | null}
 */
function checkNestedShell(shell, args, ctx) {
  if (POSIX_SHELLS.has(shell)) {
    const at = args.findIndex((a) => /^-[a-z]*c[a-z]*$/.test(a));
    const script = at === -1 ? undefined : args[at + 1];
    return script === undefined ? null : checkScript(script, ctx);
  }
  if (POWERSHELLS.has(shell)) {
    if (
      args.some((a) =>
        /^-(e|ec|en(c(o(d(e(d(c(o(m(m(a(nd?)?)?)?)?)?)?)?)?)?)?)?)$/i.test(a),
      )
    ) {
      return REASONS.encoded;
    }
    const at = args.findIndex((a) => /^-c(o(m(m(a(nd?)?)?)?)?)?$/i.test(a));
    return at === -1 ? null : checkScript(args.slice(at + 1).join(" "), ctx);
  }
  // cmd /c ... and cmd /k ...
  const at = args.findIndex((a) => /^\/[ck]$/i.test(a));
  return at === -1 ? null : checkScript(args.slice(at + 1).join(" "), ctx);
}

/** @param {string} cwd */
function gitBranch(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/** @param {string} branch */
const isMainBranch = (branch) => branch === "main" || branch === "master";

/**
 * True when a push refspec writes to main, e.g. `main`, `HEAD:main`,
 * `+feature:refs/heads/main` or `:main` (delete).
 * @param {string} refspec
 */
function refspecTargetsMain(refspec) {
  const target = refspec.includes(":")
    ? refspec.slice(refspec.lastIndexOf(":") + 1)
    : refspec;
  return isMainBranch(target.replace(/^\+/, "").replace(/^refs\/heads\//, ""));
}

// git push options whose value is a separate word, e.g. `-o ci.skip`.
const PUSH_VALUE_OPTIONS = new Set([
  "-o",
  "--push-option",
  "--repo",
  "--receive-pack",
  "--exec",
]);

/**
 * @param {string[]} args arguments after `git push`
 * @param {Context} ctx
 */
function checkPush(args, ctx) {
  /** @type {string[]} */
  const flags = [];
  /** @type {string[]} */
  const positional = [];
  let repoGiven = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? "";
    if (arg === "--repo" || arg.startsWith("--repo=")) repoGiven = true;
    if (PUSH_VALUE_OPTIONS.has(arg)) {
      i++;
    } else if (arg.startsWith("-")) {
      flags.push(arg);
    } else {
      positional.push(arg);
    }
  }
  // The first word names the remote, unless --repo already did.
  const refspecs = repoGiven ? positional : positional.slice(1);

  const forced =
    flags.some(
      (f) =>
        /^--force(-with-lease|-if-includes)?(=.*)?$/.test(f) ||
        /^-[a-zA-Z]*f[a-zA-Z]*$/.test(f),
    ) || refspecs.some((r) => r.startsWith("+"));
  if (forced) return REASONS.forcePush;

  if (flags.includes("--mirror") || flags.includes("--all")) {
    return REASONS.pushMain;
  }
  if (refspecs.some(refspecTargetsMain)) return REASONS.pushMain;

  const pushesCurrentBranch =
    refspecs.length === 0 || refspecs.some((r) => r === "HEAD" || r === "@");
  if (pushesCurrentBranch) {
    // If the branch cannot be found, the push goes ahead; GitHub's branch
    // protection still refuses anything aimed at main.
    const branch = (ctx.getBranch ?? gitBranch)(ctx.cwd);
    if (isMainBranch(branch)) return REASONS.pushMain;
  }
  return null;
}

// git's own options whose value is a separate word, e.g. `-C other/repo`.
const GIT_VALUE_OPTIONS = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--config-env",
  "--super-prefix",
]);

/**
 * @param {string[]} args arguments after `git`
 * @param {Context} ctx
 */
function checkGit(args, ctx) {
  let cwd = ctx.cwd;
  let i = 0;
  while (i < args.length) {
    const arg = args[i] ?? "";
    if (GIT_VALUE_OPTIONS.has(arg)) {
      if (arg === "-C" && args[i + 1]) cwd = resolve(cwd, args[i + 1] ?? "");
      i += 2;
    } else if (arg.startsWith("-")) {
      i += 1;
    } else {
      break;
    }
  }
  const subcommand = args[i];
  const subArgs = args.slice(i + 1);
  if (args.includes("--no-verify")) return REASONS.noVerify;
  // Pointing core.hooksPath elsewhere switches git's checks off too, whether
  // for one command (-c, --config-env) or for good (git config).
  const hooksPath = (/** @type {string} */ a) =>
    /^core\.hookspath(=|$)/i.test(a);
  const configValues = args.slice(0, i).filter((_a, j) => {
    const option = args[j - 1];
    return option === "-c" || option === "--config-env";
  });
  if (configValues.some(hooksPath)) return REASONS.noVerify;
  if (subcommand === "config" && subArgs.some(hooksPath)) {
    return REASONS.noVerify;
  }
  if (
    subcommand === "commit" &&
    subArgs.some((a) => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a))
  ) {
    return REASONS.noVerify;
  }
  if (subcommand === "clean") {
    const dryRun = subArgs.some(
      (a) => a === "--dry-run" || /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a),
    );
    return dryRun ? null : REASONS.clean;
  }
  if (subcommand === "push") return checkPush(subArgs, { ...ctx, cwd });
  return null;
}

/** @param {string[]} args arguments after `supabase` */
function checkSupabase(args) {
  const db = args.indexOf("db");
  if (db === -1 || args[db + 1] !== "reset") return null;
  const remote = args.some(
    (a) => a === "--linked" || a === "--db-url" || a.startsWith("--db-url="),
  );
  return remote ? REASONS.dbReset : null;
}

/**
 * True when a word names a real .env file, also inside an option such as
 * `--env-file=.env.local` or `-Path:.env`, or as a glob such as `.env*`.
 * @param {string} token
 */
function touchesEnvFile(token) {
  const cleaned = token.replace(/^[0-9]?[<>]+/, "");
  const candidates = [
    cleaned,
    cleaned.slice(cleaned.lastIndexOf("=") + 1),
    cleaned.slice(cleaned.lastIndexOf(":") + 1),
  ];
  return candidates.some(
    (path) => isSecretEnvFile(path) || globCouldMatchEnvFile(path),
  );
}

/**
 * @param {string[]} tokens one command segment
 * @param {Context} ctx
 * @returns {string | null}
 */
function checkSegment(tokens, ctx) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] ?? "";
    if (touchesEnvFile(token)) return REASONS.env;

    const name = commandName(token);
    const rest = tokens.slice(i + 1);
    let reason = null;
    if (POSIX_SHELLS.has(name) || POWERSHELLS.has(name) || name === "cmd") {
      reason = checkNestedShell(name, rest, ctx);
    } else if (DELETE_COMMANDS.has(name)) {
      reason = isRecursiveDelete(rest) ? REASONS.delete : null;
    } else if (name === "rimraf" && runsAsCommand(tokens, i)) {
      reason = REASONS.delete;
    } else if (name === "git") {
      reason = checkGit(rest, ctx);
    } else if (name === "supabase") {
      reason = checkSupabase(rest);
    }
    if (reason) return reason;
  }
  return null;
}

/**
 * @param {string} script
 * @param {Context} ctx
 * @returns {string | null}
 */
function checkScript(script, ctx) {
  const segments = tokenize(script);
  const names = new Set(segments.flat().map(commandName));
  // Text-level checks only when a tool that runs that text is present, so a
  // commit message that mentions "drop database" is not blocked.
  const has = (/** @type {Set<string>} */ tools) =>
    [...tools].some((tool) => names.has(tool));
  if (has(DATABASE_TOOLS) && DROP_DATABASE.test(script)) {
    return REASONS.dbReset;
  }
  if (has(SCRIPT_RUNNERS) && RECURSIVE_DELETE_CODE.test(script)) {
    return REASONS.delete;
  }
  for (const segment of segments) {
    const reason = checkSegment(segment, ctx);
    if (reason) return reason;
  }
  return null;
}

/**
 * Decides whether a shell command may run.
 * @param {string} command
 * @param {Context} ctx
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function checkCommand(command, ctx) {
  const reason = checkScript(command, ctx);
  return reason
    ? { blocked: true, reason: PREFIX + reason }
    : { blocked: false };
}

if (isMain(import.meta.url)) {
  try {
    const input = parseHookInput(await readStdin());
    const command = asRecord(input.tool_input).command;
    if (typeof command === "string") {
      const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
      const result = checkCommand(command, { cwd });
      if (result.blocked) {
        process.stderr.write(`${result.reason}\n`);
        process.exit(2);
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${PREFIX}${REASONS.hookError} (${detail})\n`);
    process.exit(2);
  }
}
