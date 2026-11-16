# Cairn: A Research-Backed Specification for a Calm Habit & Growth Tracker (built with Claude Code)

**Bottom line:** Build a small, forgiving, installable web app (PWA) with Next.js + TypeScript + Supabase. Start with only three habits and a one-tap "Today" screen. Measure progress with a habit-strength score and weekly targets rather than fragile daily streaks. Have Claude Code build it in small, tested slices behind automatic quality gates. And start the habits this week, on paper or in Notion, so building the app never replaces doing them.

## TL;DR

- **What to build:** a calm PWA you use for under a minute a day. It has a one-tap Today screen, three habits at most to start, weekly targets, "never miss twice" grace, a habit-strength score in the style of Loop Habit Tracker, a heatmap, a drift alert and a 5-minute weekly review. Goals, career/learning tracking, iOS Shortcuts logging and a saved-video "insights" library come in later phases.
- **Stack:** Next.js 16 + TypeScript (strict) + Tailwind + shadcn/ui + Recharts + Motion. Data is stored on the device first (IndexedDB) and synced to Supabase (free tier), hosted on Vercel. Installed on the iPhone Home Screen, it gets push notifications (iOS 16.4+), badges and persistent storage. It does not get widgets, Screen Time data or background sync.
- **Quality without you reading code:** a short CLAUDE.md, hooks that always run (format/lint on every edit, block risky commands), review subagents, the built-in /security-review, and GitHub Actions CI (typecheck, lint, unit/E2E/accessibility tests, dependency and secret scanning). Install very few third-party skills, and only vetted ones. Snyk's February 2026 audit found at least one critical security issue in 534 of 3,984 public agent skills (13.4%).

---

## 1. Executive summary and key recommendations

**What the research says matters most for you**

1. **Forgiveness beats perfection.** In the best-known habit-formation study (Lally et al., 2010; 96 volunteers), habits took a median of 66 days to become automatic, with a range of 18 to 254 days. Missing one opportunity did not materially affect habit formation.\[1\] Streak research agrees: broken streaks demotivate, especially when people blame themselves, and letting people "repair" a streak softens the damage. Never show a cruel "0 days" reset after one miss.
2. **Self-monitoring works, especially when it is written down.** A meta-analysis of randomised experiments (Harkin et al., 2016, *Psychological Bulletin*) found that interventions which increased progress monitoring improved goal attainment (d+ = 0.40). The effect was larger when progress was physically recorded or reported to others.\[2\]\[3\] Monitoring a *behaviour* changed that behaviour (d+ = 0.79) but did not reliably change *outcomes*.\[4\]\[5\] So track actions (cooked a healthy dinner, studied 25 minutes), not only outcomes (weight, salary).
3. **Reminders are a crutch; cues build habits.** HCI research on habit apps (Stawarz et al., CHI 2015; Renfree et al., CHI 2016) found that reminders help people repeat a behaviour but can create dependency and slow automaticity.\[6\]\[7\] Tie each habit to an existing routine instead ("after coffee, read 5 pages"), with an optional reminder as a safety net.
4. **Friction works on scrolling.** A PNAS field study of the one sec app (Grüning, Riedel & Lorenz-Spreen, 2023; 280 users, six weeks) found that 36% of attempts to open the target app were abandoned when a short breathing pause was added. Opening attempts also fell 37%, from 166 in week 1 to 105 in week 6. The study had no control group, and the app's founder co-authored it. Even so, friction is the best-evidenced, lowest-effort move against Instagram, and it lives outside your app.
5. **Calm, not sticky.** Success means opening the app for 20–40 seconds a day plus once a week for a review. No feeds, no badges for their own sake, no guilt notifications.

**Recommended stack (checked November 2026)**

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (16.4 released 6 Oct 2026) + React + TypeScript strict | The most mainstream React framework. `create-next-app` now includes an AGENTS.md and Next.js publishes its own agent skills, which suits Claude Code\[8\]\[9\] |
| UI | Tailwind CSS + shadcn/ui + lucide icons | Huge documentation footprint; you own the component code |
| Charts | Recharts plus a small custom SVG heatmap | Simple, well documented, easy to make accessible |
| Motion | Motion (formerly Framer Motion), respecting `prefers-reduced-motion` | Subtle micro-interactions |
| Local data | IndexedDB via Dexie, with `navigator.storage.persist()` | Instant, offline-first logging |
| Sync/auth | **Supabase** Free: Postgres + Auth + Row-Level Security | Free tier: 500 MB database per project, 2 active projects, no automatic backups. Supabase's pricing page says free projects are paused after 1 week of inactivity; paid projects never are |
| Hosting | Vercel Hobby (free) | Built by the Next.js team; deploys on every push |
| CI | GitHub Actions + Dependabot + CodeQL + secret scanning | Free for public repos |

**The design principles that matter most for you:**
- **Three habits at most to start.** Add a fourth only after 4 weeks at a strength of 60% or higher.
- **Weekly targets by default**, for example "cook healthy at home 5×/week".
- **A two-minute minimum version** of every habit ("read 1 page") that counts in full.
- **Never miss twice.** One miss is grace; a second miss triggers a kind recovery prompt, not a reset.
- **Honest views of slow progress:** trend lines, cumulative "votes", hours invested, and comparison against your own baseline.
- **Privacy-first:** your data is exportable any time and never goes to third-party analytics.

---

## 2. Research findings

### A. Habit-formation and behaviour-change science

**Ideas from Atomic Habits worth building in (paraphrased):**
- **Habit loop** (cue → craving → response → reward). Each habit gets a visible cue and a quick, satisfying close: the check-in animation.
- **Four laws** (make it obvious, attractive, easy, satisfying). Invert them for bad habits.
  - The app covers "obvious" (cues, the Today screen), "easy" (one tap, two-minute versions) and "satisfying" (subtle feedback, visible progress).
  - Making Instagram "invisible and difficult" happens in your phone settings, not in the app.
- **Habit stacking / implementation intentions** ("After X, I will Y"). Each habit stores its cue sentence.
- **Identity-based habits.** Each completion is a "vote" for who you want to be; the app counts votes per identity.
- **1% better / plateau of latent potential.** Results lag effort, so cumulative charts make invisible progress visible.
- **Habit tracking and "never miss twice."** A single miss is an accident; two in a row start a new pattern.
- **Environment design.** The app can prompt you to change your surroundings; it cannot do it for you.

**What the evidence actually says**

| Claim | Evidence | Strength |
|---|---|---|
| "21 days to form a habit" | Not supported. Lally et al. (2010): median 66 days, range 18–254, with automaticity rising in a flattening curve\[1\]\[10\] | Popular claim is **weak**. The 66-day figure is moderate evidence (small sample) |
| One missed day ruins a habit | Lally: one missed opportunity did not materially affect habit formation\[11\] | Moderate |
| Self-monitoring helps | Harkin et al. 2016: d+ = 0.40 on goal attainment, stronger when recorded or reported\[5\] | **Strong** |
| If-then plans help | Gollwitzer & Sheeran 2006 (94 studies): d = 0.65. A 2024 update covering 642 tests (Sheeran, Listrom & Gollwitzer, *European Review of Social Psychology*) found effects from d = 0.27 to 0.66, with d = 0.27 across 301 behaviour tests. Bias corrections disagreed: one method gave d = 0.15, a selection model gave 0.38 | Real, but **smaller than popularly claimed** |
| Streaks motivate | Silverman & Barasch 2023 (*Journal of Consumer Research*, 7 studies): intact streaks raise continued engagement compared with broken ones. Blaming yourself for the break makes it worse; being able to repair the streak helps\[12\]\[13\]\[14\]\[15\] | Moderate. Supports **forgiving, repairable** streaks |
| Reminders build habits | Stawarz 2015 and Renfree 2016: reminders help repetition but risk dependency; context cues are better\[7\]\[16\] | Moderate (small HCI studies) |
| Goal-gradient effect, the "what-the-hell" / abstinence-violation effect, self-compassion after lapses | Widely cited, and the "what-the-hell" pattern matches your healthy-eating drift | Used as design heuristics; **not re-verified in this pass** |

**Why people abandon habit apps, and how the app counters each of your patterns**

| Your pattern | Countermeasure in the app |
|---|---|
| Stop logging after a while | One-tap Today screen, iOS Shortcut logging and "fill in this week" backfill. **Unlogged days count as "unknown", not as failures** |
| Healthy eating drifted back slowly | 3-level rating (good/okay/off) instead of pass/fail, **drift detection**, context tags ("visiting family", "bored") and planned exceptions that don't count against you |
| Give up when progress feels slow | Cumulative votes, hours invested, "you vs. 8 weeks ago", milestones at 10/25/50/100 votes |
| Open Instagram when bored | A "Bored?" button that suggests your replacement activity, plus friction outside the app |
| Too many habits | Hard cap of 3 at the start; pausing a habit is a guilt-free action |

**Calm technology applied.** The app should ask for as little attention as possible:
- At most one notification per habit per day, plus a weekly review nudge.
- Peripheral signals (badge, Shortcuts) instead of in-app engagement.
- No infinite scroll, no feed, no streak-loss alarms.
- Main success metric: time to done, with a target under 30 seconds a day.

**Reducing Reels while keeping valuable use.** The toolbox, best evidence first:
1. **Friction before opening.** Use one sec, or an iOS Shortcuts automation that triggers when Instagram is opened.
2. **Environment design.** Delete Instagram from the phone, or move it off the home screen. Log out after use.
3. **A replacement habit tied to the boredom cue.** Put a reading app in Instagram's old spot.
4. **Screen Time limits and Focus modes.** These can be overridden with one tap, so treat them as a reminder rather than a barrier.
5. **One blocker, not three.** Opal or ScreenZen-style blockers work; don't stack them.

**Keep / limit / remove framework.** Score each platform on four questions:
- Do I open it on purpose or on autopilot?
- Do I feel better or worse after 20 minutes?
- Can I get the valuable part elsewhere?
- Would I pay for it, given its time cost?

| Platform | Verdict | How |
|---|---|---|
| Instagram (Reels) | **Remove from phone / heavily limit** | Keep the account on PC for DMs. Export saved posts once (see E) |
| YouTube | **Keep, deliberately** | Watch from a curated playlist on PC/TV, avoid Shorts, set a weekly time budget |
| LinkedIn | **Keep, time-boxed** | One 15-minute slot a day, or replace part of it with 2–3 AI newsletters |

**PWA limits here.** A web app **cannot read Screen Time data**. Two workarounds:
- Type Instagram's weekly Screen Time figure into the weekly review (about 10 seconds).
- Set up an iOS Personal Automation, "When Instagram is opened", that runs a Shortcut posting an event to your app's API. This counts how often you open Instagram, the same metric the one sec research uses. Test it on your iOS version, since iOS may show a notification or ask for confirmation.

### B. Competitive / inspiration review

| App | Borrow | Avoid |
|---|---|---|
| **TickTick** | Fast quick-add, habit check-ins, a Pomodoro timer linked to habits | Feature sprawl |
| **Notion** | Flexible properties, templates, links between goals, habits and notes | Blank-canvas setup fatigue; ship opinionated defaults |
| **Streaks** | Very few habits, big tap targets | Strict streak resets |
| **Habitify** | Clean stats, morning/afternoon/evening grouping | Basics behind a paywall |
| **Loop Habit Tracker** (open source, GPL-3.0) | **A habit-strength score based on exponential smoothing**: misses weaken the score without destroying it. Flexible schedules like 3×/week\[17\]\[18\]\[19\]\[20\] | Android-only, utilitarian look |
| **HabitKit / Everyday** | A year heatmap as an "identity wall" | Showing unlogged days as failures; chain anxiety |
| **Way of Life** | Green/red/skip | Judging everything as yes/no |
| **Atoms** (official Atomic Habits app; launched Feb 2024 by James Clear with Tiny, design support from MetaLab) | An identity statement per habit, habit-stacking setup, daily-goal habits, short lessons\[21\]\[22\]\[23\]\[24\] | A subscription content model; copying its "atom" visual |
| **Finch** | A warm tone after misses | Engagement loops |
| **Habitica** | — | Punishing gamification |
| **Daylio** | Ultra-fast icon logging | Pressure to log every day |
| **Exist.io** | Correlations across your data | Data overload |
| **Beeminder** | A "safety buffer" slack concept, the inspiration for grace days | Money stakes |

**Your own identity.**
- **Names:** **Cairn** (a pile of stones; each check-in adds a stone), Grain, Tally, Steady, Smallwins. Check trademarks and domains first.
- **Tone:** a calm friend. "Missed yesterday. That's fine — today is the one that counts."
- **Visuals:** warm neutrals (stone, sand, slate), one moss-green accent and a muted clay for "needs attention". No red guilt states.
- **Signature animation:** a stone settles onto the stack at check-in (≤300 ms, off under reduced motion).

### C. Dashboard, statistics and visual design

**Motivating and honest metrics:**
- Habit strength (0–100%)
- Weekly target ring ("3 of 5")
- 26-week heatmap
- Rolling 28-day rate
- Flex streak with grace
- Cumulative votes per identity
- Hours invested per skill
- Trend vs. your own baseline
- Milestones

**Avoid:** raw streaks as the hero number, rates calculated over unlogged days, and leaderboards.

**Layout:** a single mobile-first column (Today, Progress, Review) that expands to a 2–3 column dashboard on desktop. Dark and light themes follow the system setting.

**Accessibility:**
- WCAG 2.2 AA contrast.
- 44 px touch targets.
- Labelled heatmap cells.
- Data-table alternatives for charts.

**Motion:** only on state changes, 150–300 ms, with `prefers-reduced-motion` respected.

**Libraries:** Recharts, a hand-built SVG heatmap, shadcn/ui and Motion. Tremor, Nivo, visx and ECharts are all viable, but Recharts has the most examples available for an AI agent to draw on.

### D. Career and learning tracking

- **Structure (lightweight OKR):** Area → Goal (with a "why" and a target date) → Milestones → linked Habits and time logs. Daily votes visibly roll up into goals.
- **Master's degree:** courses and credits, deadlines with countdowns, study sessions, and a degree progress bar.
- **Skills:** a self-rated level from 1 to 5, reassessed monthly. Hours invested, short learning-log entries, and linked projects and certifications.
- **Learning practices to build in:**
  - Spaced repetition: link out to Anki rather than rebuilding it.
  - Deliberate practice: each session gets a specific target.
  - Learning logs, which double as retrieval practice.
  - A weekly review.
- **Portfolio:** projects with GitHub links. This app becomes portfolio item #1.

### E. Side project: saved videos → takeaways

**Instagram, the official route:** Accounts Center → Your information and permissions → Export your information → "Saved" → JSON.\[25\]\[26\]
- The ZIP contains `saved_posts.json` and `saved_collections.json`.\[26\]
- Each entry has the **post link, account name and save time. There is no video**, and usually no caption; sources disagree on captions, so check your own file.\[25\]\[27\]\[28\]\[29\]
- The download link expires after a few days.\[25\]\[29\]

**Instagram, what not to do:** Meta's terms prohibit automated data collection without permission. Scrapers and extensions that crawl your Saved page risk account restrictions, and Meta's APIs don't expose a personal saved list.

**YouTube:**
- The Data API **cannot read Watch Later**; it returns `watchLaterNotAccessible`, and has since 2016.\[30\]\[31\]
- Workaround: save videos to a normal playlist you own instead. Read it with `playlistItems.list` (1 quota unit per call) or export it with Google Takeout.\[30\]\[31\]

**Pipeline:** get the transcript → LLM summary (3 takeaways, 1 action, tags) → searchable Insights library → resurface 3 items in each weekly review.

**Recommendation:** build this as **a separate later module** (Phase 6), or as its own repo if it grows. Its value is real but secondary. The habit to build is *acting* on one takeaway a week, not collecting summaries.

### F. iOS PWA reality check and backend

| Capability on iPhone | Status | Notes (WebKit/Apple sources) |
|---|---|---|
| Install to Home Screen | ✅ | Share → Add to Home Screen. Needs a manifest with `display: standalone`. No install prompt\[32\] |
| Web Push | ✅ since iOS 16.4, **Home Screen apps only** | Permission must be requested from a user tap. Declarative Web Push (no service worker needed) since iOS 18.4\[32\]\[33\]\[34\] |
| App badge | ✅ | Shows only after notification permission is granted\[32\] |
| Offline | ✅ | Service worker + IndexedDB |
| Storage | ✅ | Home Screen apps are exempt from Safari's 7-day deletion of script-written storage. Data can still be evicted under storage pressure **unless `navigator.storage.persist()` is granted**; WebKit's heuristics favour Home Screen apps. Keep a server copy and exports anyway\[35\]\[36\]\[37\] |
| Background Sync / Periodic Sync | ❌ | Sync happens when the app opens\[38\]\[39\]\[40\] |
| Web Share Target | ❌ (per available compatibility data) | Use a Shortcut in the share sheet instead\[41\] |
| Widgets, Screen Time, Live Activities | ❌ | Native apps only |
| iOS Shortcuts → your API | ✅ | "Get Contents of URL" supports POST with a JSON body and headers. Forum reports of header bugs suggest also accepting the token in the body\[42\]\[43\]\[44\]\[45\] |

**Low-friction logging options:**
- The one-tap Today screen.
- Deep links (`/log?habit=read`).
- Shortcuts calling `POST /api/log`, triggered by the Action Button, Back Tap, Siri or a Home Screen icon.
- Tapping a notification opens `/today`.

**Backend:** **Supabase** is recommended: Postgres with Row-Level Security, built-in auth, mainstream docs, and self-hostable. The alternatives are weaker fits here:
- **Firebase** is NoSQL and more tied to one vendor.
- **Convex** has a smaller ecosystem.
- **PocketBase** needs a server you run yourself.
- **Local-first sync engines** add moving parts.

Supabase Free gives 500 MB of database and 2 active projects, has no automatic backups, and **pauses after 1 week of inactivity**. Pro costs $25/month.\[46\]\[47\]

**Next.js:** version 16 is current (16.4, October 2026). Security patches arrive frequently. For example, 16.3.3 (25 Aug 2026) fixed two unauthenticated remote-code-execution flaws: CVE-2026-75604 (CVSS 9.0), affecting Windows-hosted servers, and one in the AVIF image-optimisation path. That makes automatic dependency updates mandatory.

### G. Claude Code skills: what's real and what's hype

**Verified in the official docs (code.claude.com):**
- **Skills** are folders containing a `SKILL.md` (YAML frontmatter plus instructions). Claude loads them when relevant, or you call them with `/skill-name`. They live in `.claude/skills/` (project) or `~/.claude/skills/` (personal). Custom commands have been merged into skills, and skills follow the open Agent Skills standard.\[48\]
- **Bundled skills** include `/code-review`, `/debug`, `/verify`, `/run`, `/run-skill-generator`, `/doctor` and `/batch`. If the project has a skill named `verify` or `simplify`, Claude runs it before each commit (v2.1.286+).\[48\]
- **Hooks** live in `.claude/settings.json`. `PostToolUse` (matcher `Edit|Write`) runs formatters and linters after edits; `PreToolUse` can **block** actions with exit code 2. Hooks always run; instructions are only followed when Claude chooses to.\[49\]\[50\]
- **Subagents** are defined in `.claude/agents/`. **Plugins** bundle skills, agents and hooks and are installed with `/plugin`.
- **`/security-review`** reviews pending changes for vulnerabilities. The `anthropics/claude-code-security-review` GitHub Action does the same on pull requests. Its README warns it is not hardened against prompt injection and should review only trusted PRs, and dependency checks are left to dedicated scanners.\[51\]\[52\]\[53\]\[54\]

**Community frameworks:**
- **obra/superpowers** (Jesse Vincent) is the most widely adopted. It enforces brainstorm → plan → TDD → review. Install: `/plugin marketplace add obra/superpowers-marketplace`, then `/plugin install superpowers@superpowers-marketplace`. Reports say it is also in Anthropic's official marketplace.\[55\]\[56\]
- **GitHub Spec Kit and BMAD** are heavyweight spec-driven frameworks. You don't need them, because this document is your spec.

**The hype warning:** Snyk's February 2026 audit of 3,984 public agent skills found:
- **13.4% with at least one critical issue**: prompt injection, malicious code or suspicious downloads.
- 76 confirmed malicious payloads.
- 1,467 skills (36.82%) with at least one security flaw.

A skill is a set of instructions your agent will obey, and any scripts it includes run with your permissions.\[57\]

**Rules for third-party skills:**
- Install only from Anthropic or very widely used open repos.
- Have Claude summarise each SKILL.md first and flag anything that fetches URLs or runs scripts.
- Pin versions.
- Never give a skill credentials.

**Vetted set for this project:**
- **Built-in:** plan mode, `/code-review`, `/security-review`, `/verify`, `/doctor`.
- **Project skills you own:** `verify`, `new-slice`, `release`.
- **Subagents:** code, security, accessibility and UX-copy reviewers.
- **Optional:** `superpowers` and Next.js's own agent skills.
- **Hooks:** format/lint on every edit; block `.env*` edits, `rm -rf` and pushes to `main`.

---

## 3. The project specification (save as `/docs/SPEC.md`)

### 3.1 Product vision

**Cairn** helps one person build a few meaningful habits and grow their career. It makes small progress visible, forgives lapses and stays out of the way: under a minute a day, plus a 5-minute weekly review.

**Persona:** a working professional and master's student who uses a Windows PC and an iPhone. Motivated, but drops habits after a few weeks, drifts slowly (healthy eating), scrolls Reels when bored, and gets discouraged by slow progress. Not a programmer; values clean design and privacy.

**Problems to solve:**
1. Logging friction leads to abandonment.
2. Slow progress is invisible, which leads to quitting.
3. All-or-nothing streaks trigger the "what-the-hell" effect.
4. Drift goes unnoticed.
5. Habits feel disconnected from career goals.
6. Compulsive scrolling.

**Goals:**
- Daily logging in 30 seconds or less.
- Weekly review in 5 minutes or less.
- 3 habits sustained for 12 weeks.
- Visible links from habits to goals.
- Full data export.

**Non-goals (v1):**
- Social features, leaderboards, an AI coach chat.
- A native app, widgets or Screen Time integration.
- Task management.
- Teams.
- Monetisation.

**Principles:** frictionless, calm, forgiving, honest progress, privacy-first, small.

### 3.2 Brand and identity

- **Name:** Cairn (working title). Alternatives: Grain, Tally, Steady.
- **Voice:** calm, warm, brief, never shaming. Celebrate returns as much as streaks ("Welcome back — that's the hard part.").
- **Colour:** stone neutrals, a moss accent (about #5F7A55) and clay for attention (about #B5735A). No pure red. AA contrast in both themes.
- **Type:** Inter or Geist, with tabular numerals for stats.
- **Icons:** lucide, 1.5 px stroke.
- **Motion:** at check-in a stone settles (scale 0.9 → 1, 200 ms, ease-out); milestones get a soft glow. Nothing loops, and all motion is off under reduced motion.
- **Logo idea:** three stacked rounded stones.

### 3.3 Features by phase (user stories → acceptance criteria)

**Phase 1 — MVP (local-only, installable)**

| ID | User story | Acceptance criteria |
|---|---|---|
| F1 | Create a habit: name, identity, cue, minimum version, schedule (daily or N×/week), type (check / 3-level rating / count / minutes) | Form has 6 fields or fewer, with defaults. Max 3 active habits, with an explanation. Validated with Zod |
| F2 | One-tap logging on Today | Loads in under 1 s offline. Tap toggles; rating and count habits open an inline picker. 5-second undo. Logs persist after reload |
| F3 | Mark a day as "skip/rest" or a "planned exception" | Skips don't break streaks or count in rates. Default limit: 1 per week per habit |
| F4 | Progress screen: strength, weekly ring, 26-week heatmap, 28-day rate, flex streak, votes | Values match the formulas in §3.5 (unit-tested). Heatmap works with keyboard and has labels |
| F5 | Backfill the last 7 days | "Fill in this week" grid. Unlogged is not the same as missed |
| F6 | Install on iPhone and PC | Valid manifest and icons, standalone display, works offline after first load. `storage.persist()` requested after the first habit is created |
| F7 | Export/import JSON (plus CSV for logs) | Round-trip test: export → wipe → import gives identical data |
| F8 | "Bored?" button | Shows the user's replacement list; one tap logs "chose replacement" |

**Phase 2 — Sync and auth:**
- **F9:** magic-link or passkey sign-in, with RLS (`user_id = auth.uid()`) on every table. Tests prove user B cannot read user A's data.
- **F10:** PC ↔ iPhone sync.
  - Offline writes go to an outbox and sync on open, on focus and when back online.
  - Conflicts resolve last-write-wins by `updated_at`.
  - Check-ins are idempotent on (habit, date).
  - An E2E test syncs between two browser contexts.
- **F11:** account deletion plus full export.

**Phase 3 — Reflection and lapse recovery:**
- **F12: weekly review**, a Sunday stepper of 5 minutes or less. It covers wins, what stalled, the Instagram Screen Time number and one adjustment.
- **F13: "never miss twice" card.** After 2 consecutive misses, offer: do the minimum version, shrink the habit, reschedule, or pause.
- **F14: drift alert** (formula in §3.5). Can be dismissed; shown at most once a week per habit.
- **F15: welcome-back flow** after 7 or more days away. No backlog guilt; unlogged days stay "unknown".
- **F16: context tags on misses.** The review shows patterns, for example "4 of 6 misses: weekends away".

**Phase 4 — Goals, career, learning:**
- **F17:** Areas → Goals → Milestones, with habits linked to goals.
- **F18:** degree tracker: courses, credits, deadlines, study sessions, progress bar. At most 2 deadline chips on Today.
- **F19:** skills with level, hours, learning log and linked projects; monthly reassessment prompt.
- **F20:** a 25/50-minute focus timer that logs minutes to a skill or course.

**Phase 5 — iOS low-friction logging and notifications:**
- **F21:** personal API tokens (hashed, revocable, logging scope only).
  - `POST /api/log` accepts `{habit, value, date?}`.
  - Rate-limited.
  - The token can go in the `Authorization: Bearer` header **or** the JSON body.
- **F22:** a `/settings/shortcuts` guide with step-by-step iOS Shortcut recipes, including an "Instagram opened" automation that posts to `POST /api/events`.
- **F23:** optional Web Push, permission requested only from a button tap inside the installed app.
  - One reminder per habit, plus the weekly review nudge.
  - Quiet hours.
- **F24:** deep links of the form `/log?habit=<slug>`.

**Phase 6 — Insights module (optional, separate):**
- **F25:** import Instagram `saved_posts.json` / `saved_collections.json` and YouTube playlists (via the API or a Takeout CSV). Parser tests; duplicates detected.
- **F26:** paste a transcript → LLM summary (3 takeaways, 1 action, tags). Uses the user's own API key on the server, consent per item and a cost display.
- **F27:** a searchable library. The weekly review resurfaces 3 items you haven't acted on, each with an "acted on it" checkbox.

### 3.4 UX: screens and flows

**Navigation:** bottom tabs on mobile (Today · Progress · Review · More); a left rail on desktop. More holds Goals, Learning, Insights and Settings.

**Today (default screen):**
- Up to 3 habit cards, each with its cue line, a big tap target and a weekly ring.
- Deadline chips, the "Bored?" button and the recovery card when relevant.
- Target: **open, tap, close in 10 seconds or less**.

**Logging:**
- Check habits: one tap plus the stone animation.
- Rating habits: three large buttons (good/okay/off).
- Count and minutes: +1, or tap the number to type a value.
- A 5-second undo toast after every log.

**Progress:** a card per habit (strength %, 12-week sparkline, heatmap, votes, flex streak) and an overview comparing this week with the 4-week average. On desktop, a grid plus a large heatmap.

**Review:**
1. Look back (automatic stats).
2. Patterns (tags and drift).
3. Screen time (one number).
4. One adjustment: shrink, move the cue, pause or add.

**Empty states:**
- **First run:** "Pick up to three small habits — fewer is better at the start." Suggested templates:
  - *Read 1 page after dinner*
  - *Healthy home-cooked meal (rating)*
  - *Study 25 min for the master's*
- **Before any check-ins:** "Your first stone appears after your first check-in."

**Lapse copy:**
- 1 miss: nothing shown (grace).
- 2 misses: "Two days off *Reading*. Want to do just 1 page today?"
- 7+ days away: "Welcome back. Nothing to catch up on — let's start from today."

### 3.5 Metric definitions (exact formulas)

**Notation.** A **period** is a day (daily habits) or an ISO week (N×/week habits). Each period has a status: done, partial, missed, skipped or unknown. Dates use local time with a configurable **day boundary** (default 04:00), so a late night counts toward the previous day.

1. **Completion value x(p) ∈ [0,1].**
   - Check habit: 1 if done.
   - Rating habit: good = 1, okay = 0.5, off = 0.
   - Count or minutes habit: min(1, value/target).
   - Weekly habit: min(1, completions/N).
   - Skipped and unknown periods are **excluded**.
2. **Habit strength S.** Loop-style exponential smoothing. Start at S₀ = 0, then for each evaluated period: S ← (1−α)·S + α·x(p).
   - Daily: α = 0.052. A perfect record reaches about 80% at 30 days and about 96% at 60 days, matching Loop's documented behaviour.
   - Weekly: α = 0.2.
   - Skipped or unknown periods leave S unchanged.
   - Displayed as round(100·S).
3. **28-day rate.** Sum of x over evaluated days in the last 28 days ÷ number of evaluated days (last 4 weeks for weekly habits). Show "—" if there are fewer than 5 evaluated periods.
4. **Weekly ring.** Completions this week ÷ N, shown as "k of N".
5. **Flex streak.** Walk backward from the last closed period.
   - Each kept period (x ≥ 0.5) adds 1.
   - Skipped and unknown periods are passed over.
   - A single miss is **forgiven** if the next period was kept; it shows as a hollow stone and adds nothing.
   - Two consecutive misses end the streak.
   - The current period counts only once it is kept.
   - Repair: one missed day per 30 days can be repaired by doing the minimum version the next day and adding a note.
6. **Votes.** Count of periods with x ≥ 0.5. A rating of "okay" counts as half a vote.
7. **Drift.** Using r7 (7-day rate) and r28 (28-day rate), each needing at least 5 evaluated days: drift is true if r28 − r7 ≥ 0.25, OR the weekly rate has declined three weeks in a row.
8. **Trend vs. baseline.** Mean x over the last 28 evaluated days minus the mean over the first 28. Shown as, for example, "+18 pts since you started".
9. **Heatmap cells.** Missed, 3 intensity levels by x, hatched for skipped, empty for unknown. Each cell has an aria-label such as "Tue 12 Nov: done".
10. **Time invested.** Minutes per skill or course per ISO week, plus a cumulative hours line.

All formulas live in a pure `src/domain/metrics.ts` module, with full branch coverage in unit tests over fixture histories.

### 3.6 Data model, sync, privacy

**Common fields on every table:**
- `id` (a uuid generated on the device, so it works offline)
- `user_id`
- `created_at` and `updated_at`
- `deleted_at` (soft delete)

**Entities:**
- **Area:** name, color, sort.
- **Goal:** area_id, title, why, target_date, status.
- **Milestone:** goal_id, title, due_date, done_at.
- **Habit:** goal_id?, name, slug, identity, cue, minimum_version, type, target_value?, schedule_kind, weekly_target_n?, reminder_time?, status (active/paused/archived), replacement_for?, sort.
- **CheckIn:** habit_id, local_date, value, status, tags[], note?, source (tap/backfill/shortcut/api). **Unique (habit_id, local_date).**
- **Course, Deadline, Skill (level_history), TimeLog, LearningLogEntry, Project.**
- **WeeklyReview:** iso_week, wins, stalled, screen_time_instagram_min, adjustment, note.
- **Event:** kind (instagram_open / bored_tap / replacement_chosen), occurred_at, meta.
- **InsightItem:** source, url, author, saved_at, transcript?, summary?, takeaways, tags, acted_on_at.
- **ApiToken:** token_hash, scopes, last_used_at, revoked_at.
- **PushSubscription.**
- **Settings:** day boundary, week start, theme, timezone, locale.

**Sync:**
- Writes go to Dexie first and into an outbox.
- The sync step pushes upserts, then pulls rows changed since the last sync.
- Conflicts resolve last-write-wins per row.
- Sync runs on open, on focus, when back online, and from a "Sync now" button.
- A subtle "Synced 2 min ago" indicator shows status.

**Export:** versioned JSON (`{schemaVersion, exportedAt, data}`) plus CSV.

**Privacy and security:**
- RLS on every table, with tests.
- No third-party analytics.
- Secrets only in server environment variables.
- API tokens stored hashed.
- Zod validation everywhere.
- A strict Content-Security-Policy, HSTS and the other standard security headers.
- Rate-limited API routes.
- Weekly dependency updates.
- Account deletion.
- Because Supabase Free has no automatic backups, add a weekly automatic JSON export to your own storage.

### 3.7 Architecture, standards, testing, deployment, cost

**Architecture:**
- Next.js 16 App Router, with TypeScript `strict` and `noUncheckedIndexedAccess`.
- A client-heavy design: React hooks read Dexie; a sync module talks to Supabase; route handlers (`/api/log`, `/api/events`, `/api/push/*`) serve Shortcuts and push.
- Libraries: Tailwind, shadcn/ui, Recharts, Motion, Dexie, Zod, date-fns, supabase-js and `web-push`.
- A maintained service-worker toolkit (Serwist or an equivalent). Claude Code must confirm it works with the installed Next.js version and record the choice as an ADR (architecture decision record).

```
/docs  SPEC.md, ARCHITECTURE.md, adr/, USER-GUIDE.md
/src/app  routes (today, progress, review, goals, learning, insights, settings, api/*)
/src/components  ui/, charts/, habit/, review/
/src/domain  metrics.ts, schedule.ts, drift.ts   (pure, no I/O)
/src/data  db.ts (Dexie), repositories/, sync/
/src/lib  supabase/, validation/, auth/, push/
/supabase  migrations/, seed.sql, policy tests
/tests  unit/, integration/, e2e/, fixtures/
/.claude  settings.json, agents/, skills/
/.github  workflows/, dependabot.yml, templates
```

**Standards:**
- Domain logic kept separate from UI and storage.
- Components around 150 lines or fewer.
- No `any`.
- Explicit error handling with plain-language messages.
- All user-facing strings in one place, ready for translation.
- ESLint (Next.js, TypeScript, jsx-a11y and react-hooks rules) plus Prettier. Biome is an acceptable alternative; decide once at M0 and record it in an ADR.

**Testing:**
- Vitest unit tests: at least 95% coverage in `src/domain` and 70% overall.
- Integration tests for repositories and sync, run against a local Supabase.
- RLS policy tests.
- Playwright E2E tests for the critical flows (create a habit, check in, check in offline then sync, weekly review, export/import), run in Chromium and WebKit, with axe accessibility checks.
- Screenshots at mobile and desktop widths.

**CI on every push/PR:**
- Install, typecheck, lint, unit tests, build, E2E, accessibility checks, `npm audit --audit-level=high`.
- CodeQL, secret scanning with push protection, and weekly grouped Dependabot updates.
- Merge only when everything passes. Vercel deploys `main` to production and creates preview URLs for PRs.

**Deployment, simply:**
1. Create free GitHub, Vercel and Supabase accounts.
2. Claude Code creates and pushes the repo.
3. In Vercel, import the project.
4. In Supabase, create a project, then paste its URL and anon key into Vercel's environment variables. The service-role key goes **only** into server-side variables.
5. Claude runs the database migrations.
6. On the iPhone, open the site in Safari, then Share → Add to Home Screen.

**Secrets:** keep them in `.env.local` (git-ignored) and commit only `.env.example`. Never paste keys into chat. If one leaks, rotate it.

**Cost:**
- €0/month on the free tiers.
- Optional domain: about €10–15/year.
- Phase 6 LLM summaries: pennies each.
- Your Claude subscription is the main cost.
- Upgrade to Supabase Pro ($25/month) only if the inactivity pause or the lack of backups becomes a real problem.

### 3.8 Claude Code setup

**Proposed `CLAUDE.md`:**

```markdown
# Cairn — habit & growth tracker (PWA)
Spec: docs/SPEC.md · Architecture: docs/ARCHITECTURE.md · Decisions: docs/adr/
The owner is NOT a programmer: explain choices in plain language, ask before big decisions.

## Stack
Next.js 16 (App Router) · TypeScript strict · Tailwind + shadcn/ui · Recharts · Motion · Dexie · Supabase (RLS) · Zod · Vitest · Playwright

## Commands
npm run dev | build | typecheck | lint | test | test:e2e | check

## Rules
- Small vertical slices, one user story at a time. Plan first, wait for approval.
- Tests before or with code. Never delete or weaken a test to make it pass.
- Domain logic = pure functions in src/domain with unit tests.
- Every table has RLS and a policy test. Validate inputs with Zod. No secrets in client code. Never edit .env files.
- WCAG 2.2 AA, keyboard nav, chart text alternatives, prefers-reduced-motion.
- Calm design per SPEC §3.2: no red guilt states, animations ≤300ms.
- Conventional Commits; update docs + CHANGELOG; new dependency or architecture change → ADR.
- Before "done": npm run check, verify skill, /code-review, then a plain-language summary and how to try it.
```

**Hooks** (ask Claude to generate the exact JSON and confirm it with `/hooks`):
- `PostToolUse` on `Edit|Write`: run Prettier and `eslint --fix` on the edited file.
- `PreToolUse` on `Bash`: block `rm -rf`, pushes to `main`, `--no-verify` and production database resets.
- `PreToolUse` on `Edit|Write`: block `.env*` files.
- `Stop`: run typecheck and lint and report the results.

**Subagents:**
- `code-reviewer`
- `security-reviewer` (RLS, validation, secrets, CSP; also runs `/security-review`)
- `a11y-reviewer`
- `ux-copy-reviewer` (checks tone)

**Project skills:**
- `verify`, generated with `/run-skill-generator`; it runs before every commit.
- `new-slice`, a checklist.
- `release` (semver, CHANGELOG, tag, deploy check).

**Optional plugin:** `superpowers`. After installing it, ask Claude to list what it added, and disable anything unneeded.

**Workflow for each slice:**
1. Plan mode: restate the story, files, tests and risks, then wait for "go".
2. Write failing tests.
3. Implement the minimum to pass them.
4. Run `npm run check` and the verify skill.
5. Run the review subagents and `/security-review`, then fix what they find.
6. Make a Conventional Commit, open a PR, wait for green CI, merge.
7. Give a plain-language summary and explain how to test it on the phone.

**Definition of Done:**
- Acceptance criteria demonstrated.
- Tests green in CI.
- Typecheck and lint clean.
- No new high or critical audit findings.
- Accessibility checks pass.
- Works on mobile and desktop widths, and offline where relevant.
- Docs updated and a plain-language summary given.

**Automatic quality gates:** hooks on every edit, the verify skill before every commit, CI on every push, weekly Dependabot, and continuous CodeQL and secret scanning.

### 3.9 Milestone plan with ready-to-paste prompts

Start a fresh Claude Code session for each milestone.

- **M0 Foundations:** "Read docs/SPEC.md fully. Using plan mode first, set up Next.js 16 with TypeScript strict, Tailwind, shadcn/ui, ESLint+Prettier, Vitest, Playwright with axe, and the folder structure in §3.7. Create CLAUDE.md from §3.8, the .claude/settings.json hooks (explain each in one sentence), the four subagents, GitHub Actions CI, Dependabot, .env.example, README, MIT LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, CHANGELOG and ADR 0001. Then run /run-skill-generator to record a verify skill. Explain everything in plain language."
- **M1 Domain metrics:** "Implement src/domain/metrics.ts, schedule.ts and drift.ts exactly per SPEC §3.5 using TDD. Write fixture histories first (perfect month, one miss, two misses, skips, weekly 3×, rating habit, drift). Full branch coverage. No UI."
- **M2 Today screen:** "Implement the Dexie schema for Habit and CheckIn, the repositories, and the Today screen (F1, F2, F3, F5, F8) with the §3.2 design. Max 3 habits, one-tap logging, 5-second undo, the stone animation with reduced-motion support. Playwright test: create → check in → reload → still checked."
- **M3 Progress:** "Build F4 with accessible charts, an SVG heatmap and the §3.4 empty states."
- **M4 PWA + export:** "Make the app an installable PWA (F6). Choose a maintained service-worker library compatible with our Next.js version and write an ADR. Request storage.persist(). Implement F7 with a round-trip test. Deploy to Vercel and give me iPhone install steps."
- **M5 Supabase + sync:** "Implement F9–F11: migrations with RLS, cross-user policy tests, magic-link auth, the outbox sync from §3.6, a sync indicator, and a two-context E2E sync test. Walk me through setting environment variables safely."
- **M6 Review + recovery:** "Implement F12–F16. Have ux-copy-reviewer check all copy for kindness and brevity."
- **M7 Goals and learning:** "Implement F17–F20 while keeping Today uncluttered."
- **M8 Shortcuts + push:** "Implement F21–F24 with hashed tokens, Zod, rate limiting, an illustrated Shortcut guide, and push permission only from a button tap. Run /security-review and the security-reviewer."
- **M9 Open-source readiness:** "Self-hosting guide, screenshots, demo seed data, issue templates, v1.0.0, and a final accessibility and security pass. Make sure no secrets or personal data are in git history."
- **M10 Insights (optional):** "Implement F25–F27 behind a feature flag, with per-item consent and a cost display."

**Running it safely:**
- Never approve a command you don't understand; ask "explain this in one sentence."
- Keep `main` protected.
- Use each milestone on your phone for 3–7 days before starting the next.
- If Claude loops, start a fresh session and point it at the spec section and the failing test.

### 3.10 Risks and open questions

**Risks:**
1. **Building replaces doing.** Start the habits now on paper or in Notion.
2. **Scope creep.** Keep the phases strict and keep the backlog in a file.
3. **Supabase Free pauses after a week of inactivity**, which will happen exactly when you lapse. Local-first storage keeps the app working, and you can resume the project from the dashboard.
4. **iOS storage eviction.** Mitigated by `persist()`, sync and exports.
5. **Next.js security update cadence.** Mitigated by Dependabot.
6. **Supply-chain risk from skills.**
7. **iOS push is less reliable than native**, so don't depend on it.
8. **LLM cost and privacy** in Phase 6.

**Decide early:**
- UI language (build so translation is possible either way).
- Day boundary and week start.
- Your first three habits and their minimum versions.
- Whether to share progress with someone close. Reported or public monitoring had larger effects in the Harkin meta-analysis.\[3\]
- The app's name.
- Whether the repo is public from day one.

### 3.11 Backlog — ideas for later

- Apple Health exports
- A yearly "wrapped" review
- Correlations (after 12+ weeks of data)
- An optional mood check
- A read-only accountability link
- A templates gallery
- A Capacitor native wrapper if widgets ever become essential
- A reading list
- Anki export of insights
- Savings-rate habits linked to the career goal
- An opt-in AI review summariser
- Localisation
- Accent colours per area

---

## 4. Suggestions to improve the prompt, the project and the idea

**What was missing or ambiguous in the brief:**
- Platform and builder (now settled).
- Which exact habits, and what "success" means in 3 months.
- How much time per week goes to building.
- UI language, budget and privacy expectations.
- Whether the saved-videos tool is in scope.

The brief also mixed four products: a habit tracker, a career/learning planner, a digital-wellbeing tool and a content summariser. Naming them separately makes the phasing obvious.

**Improved prompt (reusable):**
> I want a calm, personal habit and growth tracker I open for under a minute a day. Platform: an installable web app (PWA) for my Windows PC and iPhone, built by Claude Code; I'm not a programmer, so choose the most mainstream, well-documented stack and enforce quality automatically (tests, linting, CI, security checks). Start with 3 habits: [healthy home-cooked meals 5×/week rated good/okay/off], [read ≥1 page after dinner instead of Instagram], [study 25 min for my master's on weekdays]. Use forgiving metrics (weekly targets, never-miss-twice grace, a smoothed habit-strength score), a one-tap Today screen, a 26-week heatmap, and a 5-minute Sunday review with lapse recovery and drift alerts. Later: goals → milestones → habits for career and degree, iOS Shortcuts logging, optional notifications, and a separate module turning my saved Instagram/YouTube videos into takeaways via official exports only. Design: clean, warm-neutral, subtle ≤300 ms animations, accessible, dark/light. Privacy-first, exportable, no trackers. Success in 12 weeks = still using it weekly and three habits at ≥60% strength. Ask before major decisions; explain in plain language.

**Scope warnings:**
- **The app can become the procrastination.** Track your three habits *today*, on paper or in Notion, and cap app-building at a fixed weekly budget (for example 3 hours). Park other app ideas until this reaches v1.0.
- **Ship M0–M4 first**, which gives you a usable app on your phone, before anything else.
- **Data ≠ change.** Deleting Reels from your phone matters more than any chart.

**How to know the app is helping (check monthly):**
1. Habit strength reaches 60% or more by week 12.
2. Weekly Instagram Screen Time trends down (for example −50% by week 8).
3. Actual study hours vs. planned.
4. Median daily time in the app stays under 60 seconds.
5. Your answer to a review question: "Did the app make this week easier or heavier?" (1–5).

If you abandon the app for 2+ weeks, treat that as design feedback (too much friction or too many habits), not as personal failure.

**Practical advice the app should embody for you:**

*The three starting habits, each with a two-minute version:*
- **Healthy eating:** rate dinner good/okay/off, aiming for 5 "good" a week. Family visits and home baking are **planned exceptions**. That prevents the all-or-nothing slide you described.
- **Reading instead of Reels:** "After I get into bed, I read 1 page." Put the reading app where Instagram used to be.
- **Master's:** 25 minutes after dinner on weekdays, with deadlines visible on Today.

*Platforms:* remove Instagram from the phone (or add one sec-style friction) and export your saves once. Keep YouTube deliberately through a curated playlist, and LinkedIn in a 15-minute slot.

*Drift:* the drift alert catches a slide in week 2 instead of month 3. The right response is to shrink the habit or change its cue, not to "try harder".

*Slow progress:* look at trends and cumulative votes and hours, not at today. In Lally's data, the typical person's curve flattens over about two months, and much longer for some people. Expect the middle to feel slow; that is normal.\[58\]\[59\]

## Caveats

- The contents of the Instagram export, iOS automation behaviour and Shortcuts header handling vary by version. Verify them on your device.
- The one sec study had no control group and was co-authored by the app's founder.\[60\]
- The implementation-intention effect is smaller after bias correction than the famous d = 0.65.\[61\]\[62\]\[63\]
- The goal-gradient, abstinence-violation and self-compassion findings were used as design heuristics without re-verification.
- Free-tier terms and framework versions change. Claude Code should re-check them at M0 and record an ADR.
- Nothing here is medical or nutritional advice.

## Sources

1. [How long does it take to form a habit? 66 days, not 21 (Lally et al., 2010)](https://consistencycalendar.com/science/habit-formation-66-days)
2. [Does Monitoring Goal Progress Promote Goal Attainment? A Meta-Analysis of the Experimental Evidence. - White Rose Research Online](https://eprints.whiterose.ac.uk/id/eprint/87431/)
3. [Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence - PubMed](https://pubmed.ncbi.nlm.nih.gov/26479070/?dopt=Abstract)
4. [Does Monitoring Goal Progress Promote Goal Attainment? ...](https://eprints.whiterose.ac.uk/id/eprint/91437/8/3_PDFsam_Does%20monitoring%20goal.pdf)
5. [Does monitoring goal progress work? 138 experiments, and what they say about writing it down — DontSnooze](https://dontsnooze.io/blog/does-monitoring-goal-progress-work-harkin-meta-analysis/)
6. [University of Birmingham Investigating the impact of adding plan reminders](https://pure-oai.bham.ac.uk/ws/files/71165330/Investigating_the_Impact_IWC_2019_Final.pdfSchedule)
7. [Don’t Kick the Habit: The Role of Dependency in Habit Formation Apps](https://www.researchgate.net/publication/301348307_Don't_Kick_the_Habit_The_Role_of_Dependency_in_Habit_Formation_Apps)
8. [Next.js Blog](https://nextjs.org/blog)
9. [Next.js 16 (LTS) - What's New, Support Lifecycle & EOL — VersionLog](https://versionlog.com/nextjs/16/)
10. [The 21-Day Habit Myth: Lally's Real Answer Is 66 Days](https://taskcoach.ai/blog/habit-formation-real-curve-lally-66-days/)
11. [The Study Behind “66 Days To Form A Habit” Has A Second Finding Nobody Quotes: Missing 1 Day Does Almost Nothing](https://yourmeditation.substack.com/p/the-study-behind-66-days-to-form-453)
12. [On or Off Track: How (Broken) Streaks Affect Consumer Decisions](https://udspace.udel.edu/items/42ce576b-8e1f-429a-8541-e29e48dbcfbb)
13. [How Broken Streaks Sap Motivation](https://www.psychologytoday.com/us/blog/ulterior-motives/202306/how-broken-streaks-sap-motivation)
14. [Marketing at Leeds](https://www.colorado.edu/business/faculty-research/divisions/marketing)
15. [Habit Streaks: What Breaks When the Chain Breaks — Future You](https://futureyou.me/blog/habit-streaks)
16. [strengthening implementation intentions to support habit ...](https://etheses.bham.ac.uk/id/eprint/12577/7/Wicaksono2022PhD.pdf)
17. [GitHub - iSoron/uhabits: Loop Habit Tracker, a mobile app for creating and maintaining long-term positive habits · GitHub](https://github.com/iSoron/uhabits)
18. [Loop Habit Tracker - Apps on Google Play](https://play.google.com/store/apps/details?id=org.isoron.uhabits&hl=en)
19. [Frequently Asked Questions · iSoron/uhabits · Discussion #689 · GitHub](https://github.com/iSoron/uhabits/discussions/689)
20. [Loop Habit Tracker Free Software Review · To Be Free](https://tobefree.app/en/tools/loop-habit-tracker/)
21. [Introducing Atoms: the Official App of Atomic Habits by James Clear](https://finance.yahoo.com/news/introducing-atoms-official-app-atomic-223000403.html)
22. [Atoms - from Atomic Habits App - App Store](https://apps.apple.com/sc/app/atoms-from-atomic-habits/id6474421906)
23. [Atoms. and its Alternatives - Faith Tool](https://faith.tools/app/235-atoms?category=platform-macos)
24. [Atoms App Review 2026: Price, Privacy & Christian Habit Use](https://learnofchrist.com/resources/atoms)
25. [Instagram Saved Posts: Where They Go and How to Find One](https://contextbolt.com/blog/instagram-saved-posts/)
26. [Instagram Saved Posts Exporter: The Free Built-In Way (2026)](https://savedthat.app/blog/export-instagram-saved-posts)
27. [Export Instagram Saved Posts: Step-by-Step Guide (2027)](https://www.marqly.com/blog/export-instagram-saved-posts)
28. [How to export your Instagram data and saved posts · Stashr](https://stashr.me/blog/export-instagram-data)
29. [How to export your Instagram saved posts, and keep them when posts disappear — Stowyt](https://stowyt.com/blog/export-instagram-saved-posts/)
30. [PlaylistItems: list | YouTube Data API | Google for Developers](https://developers.google.com/youtube/v3/docs/playlistItems/list)
31. [How to Export YouTube Watch Later (2027 Guide)](https://www.marqly.com/blog/export-youtube-watch-later)
32. [Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
33. [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
34. [Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)
35. [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
36. [Tracking Prevention in WebKit](https://webkit.org/tracking-prevention/)
37. [CNAME Cloaking and Bounce Tracking Defense](https://webkit.org/blog/11338/cname-cloaking-and-bounce-tracking-defense/)
38. [Background Sync API](https://caniuse.com/background-sync)
39. [Periodic background sync · Issue #380 · web-platform-dx/developer-signals · GitHub](https://github.com/web-platform-dx/developer-signals/issues/380)
40. [Background Sync API](https://openpwa.net/reference/service-worker/background-sync/)
41. [iOS PWA Limitations in 2026: What Still Doesn't Work on Safari](https://tappwa.com/blog/ios-pwa-limitations-2026)
42. [Shortcuts App (Get Contents of URL) not s… - Apple Community](https://discussions.apple.com/thread/251563782)
43. [BAD BUGS in Shortcuts Get Contents of URL… - Apple Community](https://discussions.apple.com/thread/254598909)
44. [Request your first API in Shortcuts on iPhone or iPad](https://support.apple.com/en-au/guide/shortcuts/apd58d46713f/ios)
45. [API Calls in iOS Shortcuts • Steve Simkins](https://stevedylan.dev/posts/api-calls-in-ios-shortcuts/)
46. [Pricing & Fees](https://supabase.com/pricing)
47. [Supabase Free Tier Limits 2026: Database, Projects, Pausing](https://aiagencyplus.com/supabase-free-tier-limits/)
48. <https://code.claude.com/docs/en/skills>
49. [Hooks · Claude Code 101 · Claude Academy](https://academy.claude.com/courses/claude-code-101/hooks)
50. [Claude Code settings.json, hooks, and permissions: a practical guide](https://claudefolio.com/guides/claude-code-settings-hooks-permissions)
51. [/security-review command: security audits in Claude Code](https://claude-codex.fr/en/advanced/security-review/)
52. [Claude Code Security Review: What Each Tool Catches (2026) - VibeDoctor](https://vibedoctor.io/blog/claude-code-security-review-what-your-agent-ships)
53. [Claude Code Security Review: What It Checks and Its Limits](https://xtrusio.com/blog/claude-code-security-review)
54. [automate security reviews with claude code](https://www.anthropic.com/news/automate-security-reviews-with-claude-code)
55. [Obra Superpowers for Claude Code: Setup Guide (2026) - ZecCloud](https://zeccloud.com/en/blog/articles/obra-superpowers-claude-code-guide-2026.html)
56. [superpowers - Claude Code Plugin](https://www.claudepluginhub.com/plugins/obra-superpowers-2)
57. [Claude skills and SKILL.md: the Claude Code and Codex guide](https://www.gekkode.com/en/intelligence-artificielle/agent-skills-skill-md-guide-en/)
58. [How Long Does It Take to Form a Habit? (66 Days, Not 21)](https://inklyai.info/articles/how-long-does-it-take-to-form-a-habit)
59. [How long does it take to form a habit: the 66-day evidence](https://aihabitapp.com/blog/how-long-to-form-a-habit)
60. [one sec Review (2026): A Breathing Pause, Not a Content Filter](https://learnofchrist.com/resources/one-sec)
61. [Implementation Intentions Research: 642 Tests Explained](https://goalsandprogress.com/implementation-intentions-research/)
62. [Implementation intentions · neur.ro](https://neur.ro/en/implementation-intentions/)
63. [Implementation Intentions: Why Simple If-Then Plans Work](https://yukaichou.com/gamification-analysis/implementation-intentions-if-then-planning-gollwitzer/)
