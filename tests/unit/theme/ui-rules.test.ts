/**
 * Accessibility rules the contrast test cannot see on its own: it checks the
 * colour tokens, but a class like `ring-ring/50` draws that colour faded.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const src = join(root, "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) ? [path] : [];
  });
}

// A ring or outline colour with an opacity modifier, such as `ring-ring/50`
// or `outline-ring/50`. Width classes like `ring-3` have no colour name.
const FADED_FOCUS = /\b(?:ring|outline)-[a-z][\w-]*\/\d+/g;

// Height and size classes at the start of a class name, such as `h-8` or
// `size-11`, but not ones aimed at child icons (`[&_svg]:size-4`).
const SIZE_CLASS = /(?:^|[\s"'])(?:h|size|min-h)-(\d+(?:\.\d+)?)(?=[\s"'])/g;

// Tailwind spacing is 0.25rem (4 px) per step, so 44 px is step 11.
const MIN_TOUCH_STEP = 11;

describe("focus indicators", () => {
  const files = sourceFiles(src);

  it("finds the source files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => [relative(root, file), file]))(
    "%s draws focus rings and outlines at full strength",
    (_name, file) => {
      const faded = readFileSync(file, "utf8").match(FADED_FOCUS) ?? [];
      expect(faded).toEqual([]);
    },
  );

  it.each(files.map((file) => [relative(root, file), file]))(
    "%s uses outline-hidden, which stays visible in high-contrast mode",
    (_name, file) => {
      expect(readFileSync(file, "utf8")).not.toMatch(/\boutline-none\b/);
    },
  );

  it("catches a faded ring", () => {
    expect("focus-visible:ring-ring/50".match(FADED_FOCUS)).toEqual([
      "ring-ring/50",
    ]);
    expect("@apply outline-ring/50;".match(FADED_FOCUS)).toEqual([
      "outline-ring/50",
    ]);
    expect("focus-visible:ring-3 ring-ring".match(FADED_FOCUS)).toBeNull();
  });
});

describe("touch targets", () => {
  const button = readFileSync(
    join(src, "components", "ui", "button.tsx"),
    "utf8",
  );

  it("gives every button size at least 44 px", () => {
    const steps = [...button.matchAll(SIZE_CLASS)].map((m) => Number(m[1]));
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(step).toBeGreaterThanOrEqual(MIN_TOUCH_STEP);
    }
  });

  it("reads size classes but not icon sizes", () => {
    const sample = `"h-8 gap-1" [&_svg:not([class*='size-'])]:size-4 "size-11"`;
    expect([...sample.matchAll(SIZE_CLASS)].map((m) => m[1])).toEqual([
      "8",
      "11",
    ]);
  });
});
