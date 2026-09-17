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

---

## Phase 4 — Kanji sentences with furigana — SHIPPED

Sentence mode currently filters Tatoeba down to kana-only text, which is what
made it typeable without a reading. Rendering real Japanese inverts that: the
sentence keeps its kanji, and the *reading* becomes the typing target.

Decisions taken (do not relitigate):

- **kuromoji**, devDependency, refresh-time only. Tatoeba's `jpn_indices.csv`
  was checked and rejected: its readings only disambiguate dictionary
  headwords, so common kanji get none (`職場 で の スケジュール を 使用` annotates
  neither 職場 nor 使用), and the readings it does give are dictionary-form
  against inflected surface forms. It cannot produce complete furigana.
- Use kuromoji's `reading`, **never** `pronunciation`. Typing follows spelling:
  は is typed `ha` (reading ハ), not `wa` (pronunciation ワ); 東京 is `toukyou`
  (トウキョウ), not `tōkyō` (トーキョー). `pronunciation` would make sentences
  untypeable.
- The furigana IS the typing row — one block: kanji base, kana above colouring
  as you type, English below. Not a static reference line plus a separate row.
- `useTypingEngine` and the mora splitter stay untouched. A sentence is still
  `Entry[]`; only where the kana comes from changes.

Data shape becomes `{ id, segments, translation }`, with `segments` a list of
`{ text, reading? }`. Both the displayed text and the full reading derive from
it, so nothing can drift out of sync.

### 4.1 `alignFurigana(surface, reading)`

`apps/web/src/data/furigana.ts`. Splits one token so furigana sits over the
kanji only: 忙しかっ/いそがしかっ → 忙(いそが) + しかっ. Strip the longest common
kana suffix, then prefix; the remainder is the kanji core.

Ceiling: two kanji runs split by kana (取り出す) get one span over the whole
core, not per-run furigana.

### 4.2 Mora-to-character mapping

The hazard cycle, and the reason 4.1 is not enough. kuromoji splits mid-word,
so a token can end in っ (行っ + た) — and since っ attaches to the *following*
mora, the mora った spans two segments. Per-segment mora counts are therefore
wrong by construction.

Map at the **character** level instead: every character of the reading carries
the index of the mora containing it (or null, for punctuation the splitter
skips). Colouring then works per character and boundaries stop mattering.

### 4.3 Refresh script on kuromoji

Drop `isKanaOnly` as a *filter*; keep it as a *validator* for generated
readings. Reject any sentence containing a token kuromoji does not know, or
whose reading is not kana. `isSuitable` stays exactly as is — Tatoeba is still
unfiltered.

### 4.4 Ruby rendering in `TypingCanvas`

Extend, do not fork: an optional `segments` prop switches the prompt row from
flat tokens to ruby. Absent, every existing caller renders as it does today.

### 4.5 `SentencePage` wiring

Pass segments; translation moves below the sentence; `speak()` takes the
derived text.

**Phase 4 done when:** a sentence renders its kanji with furigana above and
English below, typing its reading advances the colouring, and no test in
`useTypingEngine.test.ts` changed.

### 4.6 The rule `alignFurigana` actually needed

Shipped with 4.3 and corrected afterwards. The skip condition was "core has no
kanji", which silently discarded the reading for anything non-kana that does
not read as itself — `１０` lost じゅう. The refresh script had papered over it
with a round-trip guard comparing segments against a separately built
hiragana reading, and that guard quietly threw away nearly every katakana
sentence, since a katakana segment can never match a hiragana-ised reading.

Fixed at the root: the condition is now "is this all kana", and the script
derives its reading from the segments instead of building a second one to
disagree with. Katakana in the committed pool went 3 → 38 of 300.

Pinned by an invariant: at least 15 of the 300 entries must contain katakana,
so a future change cannot quietly strip loanwords out again.

---

## Phase 5 — Two actions, one place

The action surface had drifted: the reveal-target button advertised
`[Spacebar]`, but the binding lived in `useTypingEngine`'s window listener and
was still gated on `hasFailedOnce` — a gate Phase 3 removed from the button and
not from the key. So the button rendered from the start and the key it named
did nothing until you made a mistake.

Collapse it to two actions, both handled in `handleKeyDown` so there is one
place to read:

- **Space — restart.** Unconditional. The window listener's special-cased
  Space block goes; handling it in `handleKeyDown` gives both key paths the
  behaviour for free.
- **Tab — topline.** Toggles the reading line above the prompt. Tab was
  previously swallowed and did nothing.

`targetRevealed`/`revealTarget` become `toplineVisible`/`toggleTopline`,
because the concept changed: it is a two-way toggle of a reading line, not a
one-way reveal of a romaji target. `hasFailedOnce` loses its last consumer and
is deleted.

### The topline means something in both modes

Sentences already have one — the furigana. Practice gets the equivalent:
romaji above each kana, rendered through the SAME `<ruby>`/`<rt>` mechanism
rather than a second mechanism that happens to look similar.

Defaults differ per mode on purpose, and it is not config for its own sake:
furigana is a reading aid for kanji you otherwise cannot read, so Sentences
start with it ON; romaji over kana is the answer key, so Practice starts OFF.
Hence `initialToplineVisible` is a parameter rather than a constant, and
`resetEngine` restores it rather than forcing false.

### The row below the canvas

Exactly two action buttons — Restart [Space], Furigana [Tab] — with the live
Romaji / Kana / Accuracy readouts kept beside them as passive feedback.

---

## Known, pre-existing, not addressed

`vite-plugin-prerender` reports every route rendered, but the emitted HTML
contains only the document title — no rendered markup, on any route. Verified
against production (built before this work), which shows the same empty shell.
So the SSG setup is not currently doing what it is there to do. Out of scope
here; worth its own look.
