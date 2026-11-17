import { describe, expect, it } from "vitest";

import { planFormatting } from "../../../.claude/hooks/format-on-edit.mjs";
import {
  changedPaths,
  shouldRun,
  summarize,
} from "../../../.claude/hooks/stop-check.mjs";

describe("planFormatting", () => {
  it.each([
    ["src/app/page.tsx", "C:\\Cairn", true, true],
    ["C:\\Cairn\\src\\domain\\metrics.ts", "C:\\Cairn", true, true],
    ["c:\\cairn\\src\\x.ts", "C:\\Cairn\\", true, true],
    [".claude/hooks/lib.mjs", "C:\\Cairn", true, true],
    ["README.md", "C:\\Cairn", true, false],
    ["src/app/globals.css", "C:\\Cairn", true, false],
    [".github/workflows/ci.yml", "C:\\Cairn", true, false],
    ["package.json", "C:\\Cairn", true, false],
    ["/repo/src/app/page.tsx", "/repo", true, true],
    ["public/icon.png", "C:\\Cairn", false, false],
    ["node_modules/x/index.js", "C:\\Cairn", false, false],
    ["C:\\Cairn\\docs\\private\\notes.md", "C:\\Cairn", false, false],
    ["/repo/.next/server/page.js", "/repo", false, false],
    // Outside the project, such as Claude's own notes: left alone.
    ["C:\\Users\\me\\.claude\\CLAUDE.md", "C:\\Cairn", false, false],
    ["C:\\Cairn-other\\x.ts", "C:\\Cairn", false, false],
    ["/tmp/x.json", "/repo", false, false],
  ])("%s in %s -> prettier %s, eslint %s", (path, dir, prettier, eslint) => {
    expect(planFormatting(path, dir)).toEqual({ prettier, eslint });
  });
});

describe("changedPaths", () => {
  it("reads git status --porcelain output, including renames and quotes", () => {
    const porcelain = [
      " M src/app/page.tsx",
      "?? tests/new.test.ts",
      "R  old.ts -> new.ts",
      '?? "docs/with space.md"',
      "",
    ].join("\n");
    expect(changedPaths(porcelain)).toEqual([
      "src/app/page.tsx",
      "tests/new.test.ts",
      "new.ts",
      "docs/with space.md",
    ]);
  });

  it("returns nothing for a clean tree", () => {
    expect(changedPaths("")).toEqual([]);
  });
});

describe("shouldRun", () => {
  const base = { stopHookActive: false, hasNodeModules: true };

  it("runs when code changed", () => {
    expect(shouldRun({ ...base, changed: ["src/app/page.tsx"] })).toBe(true);
    expect(shouldRun({ ...base, changed: ["package.json"] })).toBe(true);
    expect(shouldRun({ ...base, changed: ["tsconfig.json"] })).toBe(true);
  });

  it("runs when a new folder appears as one entry", () => {
    expect(shouldRun({ ...base, changed: ["src/domain/"] })).toBe(true);
  });

  it("skips when only docs changed", () => {
    expect(
      shouldRun({ ...base, changed: ["README.md", "docs/adr/x.md"] }),
    ).toBe(false);
  });

  it("never runs twice in a row (no loops)", () => {
    expect(
      shouldRun({
        ...base,
        stopHookActive: true,
        changed: ["src/app/page.tsx"],
      }),
    ).toBe(false);
  });

  it("skips before dependencies are installed", () => {
    expect(
      shouldRun({
        ...base,
        hasNodeModules: false,
        changed: ["src/app/page.tsx"],
      }),
    ).toBe(false);
  });
});

describe("summarize", () => {
  it("reports passes and failures in plain words", () => {
    expect(
      summarize([
        { name: "typecheck", ok: true },
        { name: "lint", ok: false },
      ]),
    ).toBe(
      'Cairn checks after this turn: typecheck passed, lint FAILED (run "npm run lint").',
    );
  });
});
