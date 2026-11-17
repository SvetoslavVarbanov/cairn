# 5. shadcn/ui on Base UI, without the CLI as a dependency

- Status: accepted
- Date: 2026-11-16
- Milestone: M0

## Context

- shadcn/ui has used Base UI as its default component base since July 2026. Radix is still available with `-b radix`.
- `shadcn init` added the `shadcn` CLI package as a runtime dependency, only so `globals.css` could import one stylesheet (`shadcn/tailwind.css`, with keyframes and variants the components use). That brought in 163 packages and 6 npm audit findings (low and moderate: `deepmerge` and `minimatch` through `ts-morph`).
- The spec's palette (section 3.2) is stone neutrals, a moss accent around #5F7A55 and clay around #B5735A for attention, with no pure red and AA contrast in both themes. Dark mode follows the system.

## Decision

- Use the **Base UI** flavour (style `base-nova`) with lucide icons.
- **Vendor** the stylesheet into `src/styles/shadcn.css`, keeping its MIT notice, and remove the `shadcn` package. Add components with `npx shadcn@<pinned version> add <name>` when needed. `tw-animate-css` stays as a dev dependency.
- Replace shadcn's neutral theme with Cairn's tokens in `src/app/globals.css`. Dark mode uses `prefers-color-scheme`.
- In light mode, clay is darkened to **#9A5B43**, because white text on #B5735A is only 3.8:1 and AA needs 4.5:1. "Destructive" maps to clay, so there is no red.
- `tests/unit/theme/contrast.test.ts` checks every text and control colour pair in both themes against WCAG AA, and rejects pure red.
- Adjust shadcn components for the spec's accessibility rules when they are added:
  - focus rings and outlines at full strength, never faded with `/50` (a faded ring fails 3:1);
  - `outline-hidden` instead of `outline-none`, so focus stays visible in Windows high-contrast mode;
  - every touch target at least 44 px, so the smaller button sizes (`xs`, `sm`, `icon-xs`, `icon-sm`) are removed.

  `tests/unit/theme/ui-rules.test.ts` enforces the first and last of these.

## Consequences

- No audit findings, and 163 fewer packages.
- When a newer shadcn component needs an updated stylesheet, copy it again from the same CLI version.
