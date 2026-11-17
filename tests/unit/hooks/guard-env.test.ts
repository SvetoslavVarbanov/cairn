import { describe, expect, it } from "vitest";

import { checkFileAccess } from "../../../.claude/hooks/guard-env.mjs";
import {
  asRecord,
  baseName,
  globCouldMatchEnvFile,
  isInsideProject,
  isSecretEnvFile,
  parseHookInput,
  parseInput,
} from "../../../.claude/hooks/lib.mjs";

describe("isSecretEnvFile", () => {
  it.each([
    ".env",
    ".env.local",
    ".env.production",
    ".env.development.local",
    "C:\\Users\\me\\Cairn\\.env.local",
    "/home/me/cairn/.ENV",
    // Windows ignores trailing dots and spaces and allows ":stream" names.
    ".env.local.",
    ".env. ",
    "C:\\x\\.env:secret",
    ".ENV::$DATA",
  ])("treats %s as secret", (path) => {
    expect(isSecretEnvFile(path)).toBe(true);
  });

  it.each([
    ".env.example",
    "C:\\Cairn\\.env.example",
    "environment.ts",
    "src/env.ts",
    ".envrc-notes.md",
    "docs/.env-guide.md",
  ])("allows %s", (path) => {
    expect(isSecretEnvFile(path)).toBe(false);
  });
});

describe("checkFileAccess", () => {
  it("blocks edits to .env.local", () => {
    const result = checkFileAccess({
      tool_input: { file_path: "C:\\Cairn\\.env.local" },
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain(".env.example");
  });

  it("blocks notebook edits to an env file", () => {
    expect(
      checkFileAccess({ tool_input: { notebook_path: ".env" } }).blocked,
    ).toBe(true);
  });

  it.each([
    "supabase/.env",
    ".vercel/.env.production.local",
    "C:\\Cairn\\.env.staging",
  ])("blocks reading %s in any folder", (path) => {
    expect(checkFileAccess({ tool_input: { file_path: path } }).blocked).toBe(
      true,
    );
  });

  it("blocks a search narrowed to env files", () => {
    expect(
      checkFileAccess({ tool_input: { path: "supabase", glob: ".env" } })
        .blocked,
    ).toBe(true);
    expect(
      checkFileAccess({ tool_input: { path: ".", glob: ".env*" } }).blocked,
    ).toBe(true);
    expect(
      checkFileAccess({ tool_input: { path: ".", glob: "*.ts" } }).blocked,
    ).toBe(false);
  });

  it("blocks searching inside an env file", () => {
    expect(
      checkFileAccess({ tool_input: { pattern: "KEY", path: ".env.local" } })
        .blocked,
    ).toBe(true);
  });

  it("allows ordinary files, folders and the template", () => {
    expect(
      checkFileAccess({ tool_input: { file_path: "src/app/page.tsx" } }),
    ).toEqual({ blocked: false });
    expect(
      checkFileAccess({ tool_input: { file_path: ".env.example" } }).blocked,
    ).toBe(false);
    expect(
      checkFileAccess({ tool_input: { pattern: "x", path: "src" } }).blocked,
    ).toBe(false);
  });

  it("allows input without a path", () => {
    expect(checkFileAccess({})).toEqual({ blocked: false });
    expect(checkFileAccess({ tool_input: { file_path: 42 } })).toEqual({
      blocked: false,
    });
  });
});

describe("lib helpers", () => {
  it("parses JSON objects and rejects everything else", () => {
    expect(parseInput('{"a":1}')).toEqual({ a: 1 });
    expect(parseInput("[1,2]")).toEqual({});
    expect(parseInput("null")).toEqual({});
    expect(parseInput("not json")).toEqual({});
  });

  it("parses strictly for the safety guards", () => {
    expect(parseHookInput('{"a":1}')).toEqual({ a: 1 });
    expect(() => parseHookInput("not json")).toThrow();
    expect(() => parseHookInput("[1,2]")).toThrow();
    expect(() => parseHookInput("null")).toThrow();
  });

  it("keeps plain objects and replaces everything else", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord(null)).toEqual({});
    expect(asRecord("x")).toEqual({});
    expect(asRecord([1])).toEqual({});
  });

  it("tells files inside the project from files outside it", () => {
    expect(isInsideProject("src/x.ts", "/repo")).toBe(true);
    expect(isInsideProject("/repo/src/x.ts", "/repo/")).toBe(true);
    expect(isInsideProject("C:\\A\\b.ts", "c:\\a")).toBe(true);
    expect(isInsideProject("/repo2/x.ts", "/repo")).toBe(false);
    expect(isInsideProject("/repo", "/repo")).toBe(false);
    expect(isInsideProject("D:\\a\\b.ts", "C:\\a")).toBe(false);
  });

  it.each([
    ".env*",
    ".e[n]v.local",
    ".en?",
    ".*",
    "config/.env.*",
    ".{env,x}",
    "{.env,a}",
    "{x,}.env",
    ".{env,x}.local",
    // An unreadable set (z before a) is treated as risky.
    ".[z-a]",
  ])("treats the pattern %s as one that could pick a .env file", (pattern) => {
    expect(globCouldMatchEnvFile(pattern)).toBe(true);
  });

  it.each([
    "*.ts",
    ".eslintcache*",
    "src/**",
    ".env.example",
    "env*",
    "*.{ts,tsx}",
    "src/{a,b}.ts",
    // Spells "xa" or "x.env.local": neither name starts with .env.
    "x{a,.env.local}",
    // Bash's * skips names that start with a dot.
    "*",
    // jq expressions, not file names.
    ".[0].name",
    ".[] | {number, path: .location.path}",
    "{name, title: .output.title}",
  ])("treats the pattern %s as safe", (pattern) => {
    expect(globCouldMatchEnvFile(pattern)).toBe(false);
  });

  it("finds the last path segment on Windows and POSIX", () => {
    expect(baseName("C:\\a\\b.txt")).toBe("b.txt");
    expect(baseName("/a/b.txt")).toBe("b.txt");
    expect(baseName("b.txt")).toBe("b.txt");
    expect(baseName("")).toBe("");
  });
});
