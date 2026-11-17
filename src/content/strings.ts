/**
 * Every piece of user-facing text lives here, so the app can be translated
 * later (SPEC 3.7). Voice: calm, warm, brief, never shaming (SPEC 3.2).
 */
export const strings = {
  app: {
    name: "Cairn",
    description:
      "A calm habit tracker. Each check-in adds a stone to your cairn.",
  },
  home: {
    title: "Cairn",
    lead: "A calm place for a few small habits.",
    detail:
      "Each check-in adds a stone to your cairn. Missed days are fine, and you can pick up again any time.",
    status: "Nothing to use yet. Cairn is still being built.",
  },
} as const;

export type Strings = typeof strings;
