/**
 * Runs the real hook scripts the way Claude Code does: JSON on stdin, then
 * the exit code and stderr decide what happens.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));
const hook = (name: string) => join(root, ".claude", "hooks", name);

function runHook(name: string, input: unknown, projectDir = root) {
  const result = spawnSync(process.execPath, [hook(name)], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    timeout: 60_000,
  });
  return { code: result.status, stderr: result.stderr, stdout: result.stdout };
}

describe("guard-commands.mjs", () => {
  it("blocks rm -rf with exit code 2 and a reason", () => {
    const result = runHook("guard-commands.mjs", {
      tool_name: "Bash",
      tool_input: { command: "rm -rf node_modules" },
      cwd: root,
    });
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Blocked by Cairn's safety hook");
  });

  it("blocks Remove-Item -Recurse -Force from PowerShell", () => {
    const result = runHook("guard-commands.mjs", {
      tool_name: "PowerShell",
      tool_input: { command: "Remove-Item -Recurse -Force .next" },
    });
    expect(result.code).toBe(2);
  });

  it("allows an ordinary command", () => {
    const result = runHook("guard-commands.mjs", {
      tool_name: "Bash",
      tool_input: { command: "npm run test" },
      cwd: root,
    });
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("blocks when it cannot read its input (fails safe)", () => {
    const result = runHook("guard-commands.mjs", "not json");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("could not check");
  });

  it("allows a tool call that has no command to check", () => {
    expect(runHook("guard-commands.mjs", { tool_input: {} }).code).toBe(0);
  });
});

describe("guard-env.mjs", () => {
  it("blocks writing .env.local", () => {
    const result = runHook("guard-env.mjs", {
      tool_name: "Write",
      tool_input: { file_path: join(root, ".env.local"), content: "X=1" },
    });
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(".env files hold secrets");
  });

  it("allows editing the template", () => {
    const result = runHook("guard-env.mjs", {
      tool_name: "Edit",
      tool_input: { file_path: join(root, ".env.example") },
    });
    expect(result.code).toBe(0);
  });

  it("blocks reading an env file in a subfolder", () => {
    const result = runHook("guard-env.mjs", {
      tool_name: "Read",
      tool_input: { file_path: join(root, "supabase", ".env") },
    });
    expect(result.code).toBe(2);
  });

  it("blocks when it cannot read its input (fails safe)", () => {
    const result = runHook("guard-env.mjs", "not json");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("could not check");
  });
});

describe("format-on-edit.mjs", () => {
  const scratch = join(root, "tests", ".hook-scratch");
  mkdirSync(scratch, { recursive: true });
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  it("formats the edited file with Prettier", () => {
    // A throwaway project with its own copy of Prettier (which has no
    // dependencies). Inside this repository Prettier would skip the file,
    // because it skips everything git ignores, test scratch folders included.
    const project = mkdtempSync(join(tmpdir(), "cairn-hook-"));
    try {
      cpSync(
        join(root, "node_modules", "prettier"),
        join(project, "node_modules", "prettier"),
        { recursive: true },
      );
      const file = join(project, "format.json");
      writeFileSync(file, '{"a":1,   "b":[1,2]}');
      const result = runHook(
        "format-on-edit.mjs",
        { tool_name: "Write", tool_input: { file_path: file } },
        project,
      );
      expect(result.code).toBe(0);
      expect(readFileSync(file, "utf8")).toBe('{ "a": 1, "b": [1, 2] }\n');
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it("leaves files outside the project alone", () => {
    // A private, randomly named folder, so no other program can plant a
    // file or link at a predictable path in the shared temp folder.
    const outside = mkdtempSync(join(tmpdir(), "cairn-outside-"));
    try {
      const file = join(outside, "format.json");
      writeFileSync(file, '{"a":1,   "b":[1,2]}');
      const result = runHook("format-on-edit.mjs", {
        tool_name: "Write",
        tool_input: { file_path: file },
      });
      expect(result.code).toBe(0);
      expect(readFileSync(file, "utf8")).toBe('{"a":1,   "b":[1,2]}');
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("reports lint problems it cannot fix back to Claude", () => {
    const file = join(scratch, "bad.ts");
    writeFileSync(file, "export const value: any = 1;\n");
    const result = runHook("format-on-edit.mjs", {
      tool_name: "Write",
      tool_input: { file_path: file },
    });
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no-explicit-any");
  });

  it("does nothing for a file that no longer exists", () => {
    const result = runHook("format-on-edit.mjs", {
      tool_name: "Write",
      tool_input: { file_path: join(scratch, "missing.ts") },
    });
    expect(result.code).toBe(0);
  });
});

describe("stop-check.mjs", () => {
  it("stays quiet when it already ran this turn", () => {
    const result = runHook("stop-check.mjs", {
      stop_hook_active: true,
      cwd: root,
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
  });
});
