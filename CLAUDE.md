# Project Context

Wakana Type (`hiragana-game`) is a typeracer-style Japanese typing game. Free,
browser-only, no accounts, no backend. Deployed to Vercel at
`https://www.wakana.sbs`.

Stack: React 18 + TypeScript + Vite, Tailwind, `react-router-dom` v7,
`react-helmet-async` for per-route SEO, `wanakana` for romaji↔kana. Tests are
Vitest + Testing Library. Routes are prerendered at build time from
`apps/web/ssg/prerender-routes.ts`; coverage thresholds sit at 80% lines/functions/
branches/statements and gate the Vercel deploy.

## Layout

pnpm workspace. One deployable app; the packages exist to keep Arcade's engine
out of the app's way, not to be published.

- `apps/web` — the Vite app, its build config, and everything only it uses
  (`TypingCanvas`, `useTypingEngine`, sentence data, `speech.ts`, the pages).
- `packages/core` (`@wakana/core`) — what Arcade and the app genuinely share:
  `kanaGroups`, `FilterContext`, `CharacterFilter`. Its `@wakana/core/kana`
  subpath is a React-free entry point for build tooling, which Node's ESM
  loader parses directly and so cannot follow `.tsx` through the barrel.
- `packages/arcade` (`@wakana/arcade`) — the T-Rex runner: `engine.ts`,
  `DinoGameCanvas`, `ArcadePage`.

Tests run as one vitest pass at the repo root, not per package: the 80%
coverage gate is a property of the deployed app, and splitting it would let a
thin package hide behind a thick one.

## 2 game modes exist

1. **Practice** — `/practice`. A fixed round of `ROUND_SIZE` kana sampled from
   the selected kana groups. The script selector (Hiragana / Katakana) changes
   **what the prompt renders only** — input is always romaji keystrokes, and
   the engine always matches against the underlying hiragana. A romaji *display*
   option was built and then removed as unnecessary; `Entry.romaji` is the typed
   target and is unrelated to it.
2. **Sentences** — `/sentences`. Real Japanese sentences from Tatoeba, kanji
   included, rendered as ruby: the kanji as the base, its reading above it
   colouring in as you type, the English translation below. Sentences ship as a
   checked-in JSON file (`apps/web/src/data/sentences.json`, 300 entries) never
   fetched at runtime; `npm run sentences:refresh` regenerates it, downloading
   ~30MB to a temp dir. The script is the only way to change that file;
   hand-editing it makes the filters a lie.

   An entry is `{ id, segments, translation }` and **everything else derives
   from `segments`** — `sentenceText()` for what is displayed, and
   `sentenceReading()` for what is typed. There is deliberately no stored
   `text` field: a second copy would drift.

   Readings come from **kuromoji**, at refresh time only, so nothing reaches
   the bundle. Two rules that are not negotiable:

   - Use kuromoji's `reading`, **never** `pronunciation`. Typing follows
     spelling: は is typed `ha` (reading ハ) not `wa` (pronunciation ワ), and
     東京 is `toukyou` not `tōkyō`. `pronunciation` makes sentences untypeable.
   - Reject any sentence containing a token kuromoji does not know, and any
     whose generated reading is not kana. `isKanaOnly` stopped being the
     intake filter and became that validator. `isSuitable` is unchanged and
     still mandatory — Tatoeba is unfiltered crowd-sourced text.

   A segment keeps a reading unless its text **reads as itself** — that is the
   rule, not "does it contain kanji". Kana reads as itself and gets no
   furigana; a numeral or fullwidth latin run does not (`１０` is じゅう), and
   losing its reading would break the typed stream. Getting this wrong once
   cost the pool nearly all its katakana sentences.

   IPADIC readings are very good but not perfect (it reads 何 in 「何と言ったら」
   as なに rather than なん), and they are committed, so an occasional odd
   reading is expected rather than a bug. It is self-consistent: the reader
   types what is shown.

   Mora are mapped to reading characters, never counted per segment. kuromoji
   splits mid-word — 行った becomes 行っ + た — and っ attaches to the
   *following* mora, so the mora った straddles two segments. Per-segment
   counts are wrong by construction; `toRubySegments` walks characters instead.

   The script selector does not apply here: sentences already mix hiragana and
   katakana, so `SentencePage` passes the identity case.

   Study aids: the translation sits below the sentence and starts VISIBLE,
   with a toggle to hide it, resetting to visible on every new sentence. A
   Listen button reads the Japanese aloud via `apps/web/src/lib/speech.ts`, a
   thin wrapper over the browser's `SpeechSynthesis`. That button is absent —
   not disabled — when no Japanese voice exists, which is the normal case on
   Linux.

   Skip and Restart are different things here: Skip loads a new sentence,
   Restart retries the current one. `SentencePage` therefore passes no
   `onResetRound` — the engine resets itself and the sentence simply stays.

`/arcade` (T-Rex runner driven by typed kana) and `/kana` (reference chart) are
additional surfaces built on the same kana pool, not game modes in their own
right.

## The canvas has exactly two actions

Both live in `useTypingEngine`'s `handleKeyDown`, which is the ONE place key
handling belongs — the window listener only adapts a native event and forwards
it. Do not add a second key path; that split is what let the reveal button
advertise `[Spacebar]` while the key itself stayed gated on a flag the button
had already stopped using.

- **Space — restart.** Whatever a round reset means for that page.
- **Tab — topline.** Toggles the reading line above the prompt.

The topline is one concept with one mechanism (`<ruby>`/`<rt>`), not two
lookalikes: furigana over kanji in Sentences, romaji over kana in Practice.
Defaults differ deliberately — Sentences ON (a reading aid for kanji you
cannot otherwise read), Practice OFF (romaji over kana is the answer key) —
which is why `initialToplineVisible` is a parameter and `resetEngine` restores
it rather than forcing false.

When the sentence topline is hidden the per-mora colouring has nowhere to
live, so the kanji base colours per segment instead. Progress feedback must
survive the reading being switched off.

## Shared spine

Both modes route through the same pieces — extend these rather than forking:

- `packages/core/src/kanaGroups.ts` — `GROUPS` (46 kana across Monographs /
  Diacritics / Digraphs), `DEFAULT_GROUPS`, `createRound()`.
- `packages/core/src/FilterContext.tsx` — the one source of truth for kana-group
  selection, shared across Practice and Arcade. Script selection belongs here
  too.
- `apps/web/src/hooks/useTypingEngine.ts` — consumes `Entry[]` (`{ kana, romaji }`) and
  owns buffer, index, mistakes, accuracy, reveal-on-fail. Any new mode that can
  express its content as `Entry[]` reuses this engine instead of writing one.
- `apps/web/src/components/TypingCanvas.tsx` — prompt rendering and the focus overlay.
  Script transforms apply at this seam.

## Constraints

- Tatoeba sentences are CC-BY 2.0 FR. Attribution is required wherever they
  appear, and the `/about` page carries it.
- The build must never depend on the network. Sentence data is committed;
  refreshing it is an explicit, separate command.
- New routes must be added to `apps/web/ssg/prerender-routes.ts` or they ship
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
