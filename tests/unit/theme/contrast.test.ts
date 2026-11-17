import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../../src/app/globals.css", import.meta.url)),
  "utf8",
);

/** Returns the text inside the braces that open at `open`, nested braces included. */
function blockAt(open: number): string {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("Unclosed block in globals.css");
}

/** Reads `--name: #rrggbb;` declarations from the first `:root` block after `marker`. */
function readTokens(marker: string): Map<string, string> {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`Marker not found: ${marker}`);
  const block = blockAt(css.indexOf("{", css.indexOf(":root", start)));
  const tokens = new Map<string, string>();
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const [, name, hex] = match;
    if (name && hex) tokens.set(name, hex.toLowerCase());
  }
  return tokens;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

// WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for controls and focus indicators.
const TEXT = 4.5;
const NON_TEXT = 3;

const pairs: [fg: string, bg: string, min: number][] = [
  ["foreground", "background", TEXT],
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["primary", "background", TEXT],
  ["primary", "card", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["muted-foreground", "background", TEXT],
  ["muted-foreground", "muted", TEXT],
  ["muted-foreground", "card", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["attention-foreground", "attention", TEXT],
  ["attention", "background", TEXT],
  ["attention", "card", TEXT],
  ["attention-muted-foreground", "attention-muted", TEXT],
  ["destructive", "background", TEXT],
  ["destructive", "card", TEXT],
  ["sidebar-foreground", "sidebar", TEXT],
  ["sidebar-primary-foreground", "sidebar-primary", TEXT],
  ["sidebar-accent-foreground", "sidebar-accent", TEXT],
  ["input", "background", NON_TEXT],
  ["input", "card", NON_TEXT],
  ["ring", "background", NON_TEXT],
  ["ring", "card", NON_TEXT],
  ["ring", "muted", NON_TEXT],
  ["ring", "accent", NON_TEXT],
];

const themes = {
  light: readTokens("Cairn palette"),
  dark: readTokens("@media (prefers-color-scheme: dark) {"),
};

describe.each(Object.entries(themes))("%s theme", (_name, tokens) => {
  it("defines every token the checks need", () => {
    for (const [fg, bg] of pairs) {
      expect(tokens.has(fg), `missing --${fg}`).toBe(true);
      expect(tokens.has(bg), `missing --${bg}`).toBe(true);
    }
  });

  it.each(pairs)("%s on %s meets %d:1", (fg, bg, min) => {
    const ratio = contrast(tokens.get(fg) ?? "", tokens.get(bg) ?? "");
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it("has no pure red", () => {
    for (const hex of tokens.values()) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const isRed = r > 180 && g < 80 && b < 80;
      expect(isRed, `${hex} looks like a guilt red`).toBe(false);
    }
  });
});
