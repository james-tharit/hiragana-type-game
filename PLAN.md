# Plan — complete the two declared game modes

Status: Practice exists but is hiragana-only; Sentences does not exist.
Everything below is one behavior per `/tdd` cycle, one fresh `tdd-worker`
(`model: sonnet`) per behavior, ponytail restated in each worker prompt.

Decisions already taken (do not relitigate):

- Script selection changes the **rendered prompt only**. Input stays romaji, the
  engine keeps matching hiragana. No engine changes.
- Sentences are **kana-only**, so there is no reading field and nothing
  ambiguous to type.
- Sentence JSON is **committed** and refreshed by an explicit command before a
  deploy. The build never touches the network.

Fixed inline already: `DEFAULT_GROUPS` referenced `'s-line'`, which matches no
group id, so the sa-so row silently never appeared in the default round → now
`'sa-so'`.

---

## Phase 1 — Script selection (Hiragana / Katakana) — SHIPPED

Romaji was built as a third option and then removed on request. `Script` has two
members; `displayFor` takes a bare kana string, since romaji was the only case
that needed the whole `Entry`.

### 1.1 `displayFor(kana, script)`

`src/constants/kanaGroups.ts` (owns `Entry`, so it owns the transform).

- `'hiragana'` → `kana` unchanged
- `'katakana'` → `toKatakana(kana)` (wanakana, already a dependency)

Accept: `displayFor('きゃ', 'katakana') === 'キャ'`.

### 1.2 `script` in `FilterContext`

Add `script: Script` + `setScript` to the existing context. Default
`'hiragana'`. It rides the same provider as `selectedGroupIds`, so Practice and
Arcade stay in sync for free.

Accept: changing script re-renders consumers; default is hiragana; the existing
group-selection tests still pass.

### 1.3 Script selector UI

Two-button segmented control in `CharacterFilter`, above the group grid.
Native `<button>` with `aria-pressed` — no new dependency, no radix.

Accept: clicking Katakana calls `setScript('katakana')`; the active button is
the only one with `aria-pressed="true"`.

### 1.4 `TypingCanvas` renders through `displayFor`

Both seams: the token row **and** the in-progress `composedKana` preview (a
katakana prompt with a hiragana preview underneath looks broken).

Accept: with script `katakana` and tokens `[あ, か]` the canvas shows `ア カ`;
the typed-so-far preview shows katakana too.

### 1.5 Arcade honors the script

`CharacterFilter` is shared, so the selector also appears on `/arcade`. The pool
memo maps each entry's kana through `displayFor` and leaves its romaji alone —
the engine keeps `wordTarget` (displayed) separate from `romajiTarget` (matched),
so this is one line.

**Phase 1 done when:** the Practice prompt switches script live, no test in
`useTypingEngine.test.ts` or `engine.test.ts` changed.

---

## Phase 2 — Sentence mode

### 2.1 `isKanaOnly(text)`

`src/data/sentences.ts`. True only for hiragana/katakana/ー plus `、。！？` and
spaces. Exported so the refresh script stays a thin shell around tested logic.

Accept: `ねこがすきです。` true; `猫が好きです。` false; `Hello` false; `''` false.

### 2.2 `sentenceToEntries(text): Entry[]`

The one real algorithm here. Split a kana sentence into mora and pair each with
its romaji via wanakana `toRomaji`:

- digraphs: `きゃ` is **one** entry, not two (small ゃゅょぁぃぅぇぉ attach left)
- sokuon: `っ` attaches to the **following** mora so `っか` → `kka`
- punctuation and spaces are skipped entirely, never typed

Accept: `きゃ` → 1 entry `kya`; `がっこう` → `ga/kko/u`; `ねこ。` → 2 entries, the
`。` absent. This is the behavior most likely to be wrong — give it the fullest
test table of any cycle.

### 2.3 Refresh script + committed data

`scripts/refresh-sentences.ts`, wired as `npm run sentences:refresh`. Pulls the
Tatoeba jpn sentences + eng links export, filters with `isKanaOnly`, caps the
pool, writes `src/data/sentences.json` as `{ id, text, translation }[]`.

Not part of the app bundle path; exclude from coverage. Commit the JSON.

Accept: running it produces a non-empty JSON where every `text` passes
`isKanaOnly`; the app builds with the network unplugged.

### 2.4 `SentencePage` at `/sentences`

Reuses `useTypingEngine` — a sentence is just `Entry[]`, which is exactly what
the engine already consumes. Picks a random sentence, renders it through the
same `TypingCanvas`, shows the English translation, advances on finish.

No new engine, no new canvas. If this cycle starts growing either, stop and
re-scope.

Accept: renders a sentence, typing its romaji completes it, finishing loads a
different one.

### 2.5 Wiring

Route in `AppRoutes`, nav link in `CommonNav`, `/sentences` added to
`ssg/prerender-routes.ts`, Helmet block matching the other pages, and the
CC-BY 2.0 FR attribution for Tatoeba on `/about`.

Accept: `/sentences` reachable from the nav, present in prerender routes,
attribution visible on About.

---

## Order and risk

1.1 → 1.2 → 1.3 → 1.4, then 2.1 → 2.2 → 2.3 → 2.4 → 2.5. Phase 1 ships and is
useful on its own.

Riskiest: **2.2**. Sokuon and digraph handling is where a naive per-character
split silently produces unmatched romaji, and the failure looks like "typing is
broken" rather than "the splitter is wrong".

Watch the 80% coverage gate — it fails the Vercel deploy, and `SentencePage`
plus the new UI will drag the average if their cycles skip tests.
