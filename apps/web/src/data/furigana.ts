import { isSkippedForTyping, sentenceToEntries } from './sentences.ts';

export type Segment = { text: string; reading?: string };
export type RubyChar = { char: string; mora: number | null };
export type RubySegment = { text: string; reading?: string; chars: RubyChar[] };

const isKana = (ch: string) => /[\p{Script=Hiragana}\p{Script=Katakana}ー]/u.test(ch);
const isAllKana = (s: string) => [...s].every(isKana);

/**
 * Splits one morphological token into ruby segments so furigana sits only
 * over the kanji core, not the whole word.
 */
export function alignFurigana(surface: string, reading: string): Segment[] {
  if (!reading) return [{ text: surface }];

  let sEnd = surface.length;
  let rEnd = reading.length;
  while (
    sEnd > 0 &&
    rEnd > 0 &&
    isKana(surface[sEnd - 1]) &&
    surface[sEnd - 1] === reading[rEnd - 1]
  ) {
    sEnd--;
    rEnd--;
  }

  let sStart = 0;
  let rStart = 0;
  while (
    sStart < sEnd &&
    rStart < rEnd &&
    isKana(surface[sStart]) &&
    surface[sStart] === reading[rStart]
  ) {
    sStart++;
    rStart++;
  }

  const prefix = surface.slice(0, sStart);
  const core = surface.slice(sStart, sEnd);
  const coreReading = reading.slice(rStart, rEnd);
  const suffix = surface.slice(sEnd);

  if (isAllKana(core) || core === coreReading) return [{ text: surface }];
  if (!coreReading) return [{ text: surface }];

  // ponytail: a core with two kanji runs split by kana (e.g. 取り出す) gets
  // one ruby span over the whole core rather than per-run alignment.
  // Upgrade: align each kanji run to its own reading slice individually.
  const segments: Segment[] = [];
  if (prefix) segments.push({ text: prefix });
  segments.push({ text: core, reading: coreReading });
  if (suffix) segments.push({ text: suffix });
  return segments;
}

// Maps every character of `reading` to the index of the mora it belongs to
// in sentenceToEntries(reading), or null when the character is dropped from
// typing entirely (punctuation, or an orphaned sokuon with no following
// mora). Walks the reading and the real entries output in parallel instead
// of reclassifying characters itself, so a mora that straddles two segments
// (kuromoji splits 行った as 行っ + た) still marks both halves.
function moraIndicesFor(reading: string): (number | null)[] {
  const entries = sentenceToEntries(reading);
  let entryIdx = 0;
  let charIdx = 0;
  return [...reading].map((ch) => {
    if (isSkippedForTyping(ch)) return null;

    const entry = entries[entryIdx];
    if (entry && entry.kana[charIdx] === ch) {
      const mora = entryIdx;
      charIdx++;
      if (charIdx >= entry.kana.length) {
        entryIdx++;
        charIdx = 0;
      }
      return mora;
    }
    // Not the next expected mora character (e.g. a trailing sokuon
    // sentenceToEntries dropped) — not part of any mora.
    return null;
  });
}

// What the reader sees, and what they type. Both derive from the segments so
// neither can drift out of sync with them.
export function sentenceText(segments: Segment[]): string {
  return segments.map((s) => s.text).join('');
}

export function sentenceReading(segments: Segment[]): string {
  return segments.map((s) => s.reading ?? s.text).join('');
}

export function toRubySegments(segments: Segment[]): RubySegment[] {
  const fullReading = sentenceReading(segments);
  const indices = moraIndicesFor(fullReading);

  let pos = 0;
  return segments.map((seg) => {
    const source = seg.reading ?? seg.text;
    const chars: RubyChar[] = [...source].map((char) => ({
      char,
      mora: indices[pos++],
    }));
    return { text: seg.text, reading: seg.reading, chars };
  });
}
