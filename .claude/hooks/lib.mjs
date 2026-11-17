// @ts-check
/**
 * Shared helpers for Cairn's Claude Code hooks. Hooks receive one JSON
 * object on stdin and signal "blocked" with exit code 2 plus a message on
 * stderr (https://code.claude.com/docs/en/hooks).
 */
import { pathToFileURL } from "node:url";

/** Starts every message a safety guard shows when it blocks something. */
export const BLOCK_PREFIX = "Blocked by Cairn's safety hook: ";

/** @returns {Promise<string>} everything written to stdin */
export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * The value itself when it is a plain object, otherwise an empty object.
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function asRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? /** @type {Record<string, unknown>} */ (value)
    : {};
}

/**
 * Parses hook input strictly, for the safety guards: anything that is not a
 * JSON object throws, so the guard can fail safe.
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseHookInput(text) {
  const value = JSON.parse(text);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("hook input is not a JSON object");
  }
  return asRecord(value);
}

/**
 * Parses hook input leniently, for the helper hooks that only format or
 * report: anything that is not a JSON object becomes an empty object.
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseInput(text) {
  try {
    return parseHookInput(text);
  } catch {
    return {};
  }
}

/**
 * True when the module at `metaUrl` is the script Node was asked to run.
 * @param {string} metaUrl
 */
export function isMain(metaUrl) {
  const entry = process.argv[1];
  return Boolean(entry) && metaUrl === pathToFileURL(entry ?? "").href;
}

/**
 * The last path segment, for both Windows and POSIX separators.
 * @param {string} filePath
 */
export function baseName(filePath) {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] ?? "";
}

/**
 * True for real secret files such as `.env` or `.env.local`, in any folder.
 * The committed template `.env.example` is allowed.
 * @param {string} filePath
 */
export function isSecretEnvFile(filePath) {
  // Windows reads ".env:x" (a stream of .env), "C:.env" (drive-relative) and
  // ".env." or ".env " (trailing dots and spaces dropped) as the same file.
  const name = baseName(filePath)
    .toLowerCase()
    .replace(/^[a-z]:/, "")
    .replace(/:.*$/, "")
    .replace(/[. ]+$/, "");
  return /^\.env(\..+)?$/.test(name) && name !== ".env.example";
}

// Typical secret file names a wildcard pattern is tested against.
const ENV_SAMPLES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
  ".env.staging",
  ".env.x",
];

/**
 * Turns a shell wildcard pattern (`*`, `?`, `[abc]`, `{a,b}`) into the body of
 * a regular expression. Characters without a wildcard meaning match
 * themselves, so jq expressions such as `.[] | {a}` match nothing useful.
 * @param {string} glob
 * @returns {string}
 */
function globToRegExpSource(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob.charAt(i);
    if (ch === "*") {
      out += "[^/]*";
    } else if (ch === "?") {
      out += "[^/]";
    } else if (ch === "[" && glob.indexOf("]", i + 2) !== -1) {
      // A ] straight after [ belongs to the set, as in shells.
      const close = glob.indexOf("]", i + 2);
      const body = glob.slice(i + 1, close).replace(/^!/, "^");
      out += `[${body.replace(/[\\\]]/g, "\\$&")}]`;
      i = close;
    } else if (ch === "{" && glob.indexOf("}", i) !== -1) {
      const close = glob.indexOf("}", i);
      const choices = glob.slice(i + 1, close).split(",");
      out += `(?:${choices.map(globToRegExpSource).join("|")})`;
      i = close;
    } else {
      out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return out;
}

/**
 * True for a wildcard pattern that could pick a `.env` file, such as `.env*`,
 * `.e[n]v.local`, `.en?`, `.*` or `{x,}.env`. Patterns that start with `*` or
 * `?` are safe: shells never let those match a name starting with a dot.
 * @param {string} pattern
 */
export function globCouldMatchEnvFile(pattern) {
  const name = baseName(pattern).toLowerCase();
  const wildcard = name.search(/[*?[{]/);
  if (wildcard === -1 || /^[*?]/.test(name)) return false;
  // Any name that starts with .env counts, e.g. .env.st* for .env.staging.
  if (name.slice(0, wildcard).startsWith(".env")) return true;
  try {
    const matcher = new RegExp(`^${globToRegExpSource(name)}$`);
    return ENV_SAMPLES.some((sample) => matcher.test(sample));
  } catch {
    return true; // A pattern that cannot be read is treated as risky.
  }
}

/**
 * True when `filePath` is inside `projectDir`. Relative paths count as
 * inside. Windows drive paths compare without regard to case.
 * @param {string} filePath
 * @param {string} projectDir
 */
export function isInsideProject(filePath, projectDir) {
  const norm = (/** @type {string} */ p) =>
    p.replace(/\\/g, "/").replace(/\/+$/, "");
  const file = norm(filePath);
  if (!/^([a-z]:)?\//i.test(file)) return true;
  const dir = norm(projectDir);
  const windows = /^[a-z]:\//i.test(dir);
  return (windows ? file.toLowerCase() : file).startsWith(
    `${windows ? dir.toLowerCase() : dir}/`,
  );
}
