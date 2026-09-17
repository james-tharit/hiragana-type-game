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

## Phase 2 — Sentence mode — SHIPPED

Sentences already mix hiragana and katakana, so the Phase 1 script selector does
**not** apply here — `SentencePage` passes the identity case and renders no kana
filter. A sentence is not drawn from a kana pool.

### 2.1 `isKanaOnly(text)`

`src/data/sentences.ts`. True only for hiragana/katakana/ー plus `、。！？` and
spaces. Exported so the refresh script stays a thin shell around tested logic.

Accept: `ねこがすきです。` true; `猫が好きです。` false; `Hello` false; `''` false.

### 2.2 `sentenceToEntries(text): Entry[]`

The one real algorithm here. Split a kana sentence into mora and pair each with
its romaji via wanakana `toRomaji`:

- digraphs: `きゃ` is **one** entry, not two (small ゃゅょぁぃぅぇぉ attach left)
- long vowel: `ー` also attaches left, so `コー` is one entry
- sokuon: `っ` attaches to the **following** mora so `っか` → `kka`
- punctuation and spaces are skipped entirely, never typed

wanakana's output is typeable ASCII throughout — verified: `コー` → `koo`, not
`kō`. No macron handling needed, so don't build any.

Accept: `きゃ` → 1 entry `kya`; `がっこう` → `ga/kko/u`; `ねこ。` → 2 entries, the
`。` absent. This is the behavior most likely to be wrong — give it the fullest
test table of any cycle.

### 2.3 Refresh script + committed data

`scripts/refresh-sentences.ts`, wired as `npm run sentences:refresh`. Downloads
to a temp dir, filters with `isKanaOnly`, caps the pool, writes
`src/data/sentences.json` as `{ id, text, translation }[]`, deletes the temp dir.

Three exports, ~30MB total, sizes confirmed 2026-09-16:

| File | Size | Why |
|---|---|---|
| `per_language/jpn/jpn_sentences.tsv.bz2` | 3.4 MB | the sentences |
| `per_language/jpn/jpn-eng_links.tsv.bz2` | 1.5 MB | jpn id → eng id |
| `per_language/eng/eng_sentences.tsv.bz2` | 24.9 MB | the translations |

all under `https://downloads.tatoeba.org/exports/`. Do **not** use the top-level
`links.tar.bz2` — it is 150MB and the per-language file is the same mapping.

Not part of the app bundle path; exclude from coverage. Commit the JSON, never
the downloads.

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

### 2.6 Content filter

Tatoeba is unfiltered crowd-sourced text. `isSuitable(translation)` in
`src/data/sentences.ts` drops profanity and violent content during refresh.

Word-boundary matching (`\b`, case-insensitive) against a deliberately short
blocklist — substring matching silently guts the pool, dropping "Hello" for
*hell* and "diet" for *die*. The invariant test pins the pool at 300 entries so
an over-broad blocklist fails loudly rather than quietly shrinking the data.

Accept: "Hello, Tom." and "I'm on a diet." survive; "I'm gonna shoot him." does
not; regenerated pool is 300 entries all passing `isSuitable`.

---

## Phase 3 — Sentence-mode study aids — SHIPPED

Reference point: Taipingu. Three asks, but two were already half-built — read the
existing code before assuming anything here is new.

### 3.1 Ungate the romaji hint

`TypingCanvas` already renders a "Reveal target" button (and a Spacebar binding)
showing the current mora's romaji — but only `hasFailedOnce`. Drop that gate so
it is available from the start.

`TypingCanvas` is shared, so this also ungates Practice. Deliberate: a prop to
preserve Practice's stricter gate is config for a difference nobody asked for.
One boolean prop reverses it if that turns out wrong.

Accept: the reveal button renders before any mistake is made; revealing still
shows only the current mora.

### 3.2 `speak()` helper

`src/lib/speech.ts`, wrapping the browser's `SpeechSynthesis` API — native
platform feature, no dependency.

- `speak(text)` utters the text with `lang = 'ja-JP'`
- `canSpeakJapanese()` reports whether synthesis and a Japanese voice exist

Its own module rather than inline in the page, because jsdom has no
`speechSynthesis` and a seam makes it stubbable.

Accept: absent API returns false instead of throwing; a queued utterance cancels
a previous one rather than overlapping.

### 3.3 Translation behind a toggle

`SentencePage` shows `sentence.translation` unconditionally today. Start hidden,
reveal on click — reading the English first defeats the exercise. Resets to
hidden on each new sentence.

Accept: translation absent until the toggle is pressed; hidden again after Skip.

### 3.4 Listen button

Speaker button on `SentencePage` calling `speak(sentence.text)`. Hidden entirely
when `canSpeakJapanese()` is false — a button that silently does nothing is worse
than no button. Japanese voice availability is OS-dependent and often absent on
Linux, so the disabled path is the common one, not an edge case.

Accept: click utters the sentence text; no Japanese voice means no button.

---

## Order and risk

1.1 → 1.2 → 1.3 → 1.4, then 2.1 → 2.2 → 2.3 → 2.4 → 2.5. Phase 1 ships and is
useful on its own.

Riskiest: **2.2**. Sokuon and digraph handling is where a naive per-character
split silently produces unmatched romaji, and the failure looks like "typing is
broken" rather than "the splitter is wrong".

Watch the 80% coverage gate — it fails the Vercel deploy, and `SentencePage`
plus the new UI will drag the average if their cycles skip tests.
