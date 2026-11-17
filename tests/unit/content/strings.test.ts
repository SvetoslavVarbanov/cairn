import { describe, expect, it } from "vitest";

import { strings } from "@/content/strings";

/** Collects every string value in the nested strings object. */
function allStrings(value: unknown, path = "strings"): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      allStrings(child, `${path}.${key}`),
    );
  }
  return [];
}

const entries = allStrings(strings);

// U+2013 (en dash) and U+2014 (em dash), built from code points so this file
// itself contains neither character.
const EN_OR_EM_DASH = new RegExp(
  `[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`,
);

describe("user-facing strings", () => {
  it("has at least one string", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s is not empty", (_path, text) => {
    expect(text.trim()).not.toBe("");
  });

  it.each(entries)("%s uses no em or en dashes", (_path, text) => {
    expect(text).not.toMatch(EN_OR_EM_DASH);
  });

  it.each(entries)("%s uses no emojis", (_path, text) => {
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it.each(entries)(
    "%s has no exclamation marks (calm voice)",
    (_path, text) => {
      expect(text).not.toContain("!");
    },
  );
});
