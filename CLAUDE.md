# Project Context

Wakana Type (`hiragana-game`) is a typeracer-style Japanese typing game. Free,
browser-only, no accounts, no backend. Deployed to Vercel at
`https://www.wakana.sbs`.

Stack: React 18 + TypeScript + Vite, Tailwind, `react-router-dom` v7,
`react-helmet-async` for per-route SEO, `wanakana` for romaji↔kana. Tests are
Vitest + Testing Library. Routes are prerendered at build time from
`ssg/prerender-routes.ts`; coverage thresholds sit at 80% lines/functions/
branches/statements and gate the Vercel deploy.

## 2 game modes exist

1. **Practice** — `/practice`. A fixed round of `ROUND_SIZE` kana sampled from
   the selected kana groups. The script selector (Hiragana / Katakana) changes
   **what the prompt renders only** — input is always romaji keystrokes, and
   the engine always matches against the underlying hiragana. A romaji *display*
   option was built and then removed as unnecessary; `Entry.romaji` is the typed
   target and is unrelated to it.
2. **Sentences** — `/sentences`. Whole kana-only sentences sourced from
   Tatoeba, typed end to end with the English translation shown. Sentences ship
   as a checked-in JSON file (`src/data/sentences.json`, 300 entries) never
   fetched at runtime; `npm run sentences:refresh` regenerates it, downloading
   ~30MB to a temp dir. The script filters for kana-only text, a usable length,
   and suitability — Tatoeba is unfiltered, so that last filter is not optional.
   The script is the only way to change that file; hand-editing it makes the
   filters a lie.

   The script selector does not apply here: sentences already mix hiragana and
   katakana, so `SentencePage` passes the identity case.

`/arcade` (T-Rex runner driven by typed kana) and `/kana` (reference chart) are
additional surfaces built on the same kana pool, not game modes in their own
right.

## Shared spine

Both modes route through the same pieces — extend these rather than forking:

- `src/constants/kanaGroups.ts` — `GROUPS` (46 kana across Monographs /
  Diacritics / Digraphs), `DEFAULT_GROUPS`, `createRound()`.
- `src/contexts/FilterContext.tsx` — the one source of truth for kana-group
  selection, shared across Practice and Arcade. Script selection belongs here
  too.
- `src/hooks/useTypingEngine.ts` — consumes `Entry[]` (`{ kana, romaji }`) and
  owns buffer, index, mistakes, accuracy, reveal-on-fail. Any new mode that can
  express its content as `Entry[]` reuses this engine instead of writing one.
- `src/components/TypingCanvas.tsx` — prompt rendering and the focus overlay.
  Script transforms apply at this seam.

## Constraints

- Tatoeba sentences are CC-BY 2.0 FR. Attribution is required wherever they
  appear, and the `/about` page carries it.
- The build must never depend on the network. Sentence data is committed;
  refreshing it is an explicit, separate command.
- New routes must be added to `ssg/prerender-routes.ts` or they ship
  unprerendered.

# Working agreement

Implementation work goes through `/tdd`: one behavior per cycle, one **fresh**
`tdd-worker` subagent per behavior (`model: sonnet`), test written and watched
failing before the code exists. Never write feature code in the main context,
and never reuse a worker across behaviors. Subagents do not inherit the session
hooks, so the ponytail posture is restated in every worker prompt. Config edits,
renames and one-liners are done inline — dispatching a subagent to change a
constant costs more than the change.

Ponytail is the default build posture: reuse before writing, stdlib before
dependencies, shortest working diff — after reading the code the change touches,
never instead. Deliberate shortcuts get a `ponytail:` comment naming the ceiling
and the upgrade path; `/ponytail-debt` harvests them later.

Keep the main context for decisions. Test output, file dumps and dead ends stay
in the subagent that produced them. Localize with `caveman-explore` before
dispatching work; run noisy commands through `caveman shrink -- <cmd>` rather
than reading their output in full.

Prose is caveman-terse: no preamble, no tool-call narration, no restating what a
diff already shows. Technical literals — code, paths, symbols, error strings,
numbers — stay exact.
