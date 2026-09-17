import { toRomaji } from 'wanakana';
import type { Entry } from '../constants/kanaGroups';

const KANA_ONLY_RE =
  /^[\p{Script=Hiragana}\p{Script=Katakana}ー、。！？ 　]+$/u;

export function isKanaOnly(text: string): boolean {
  return text.length > 0 && KANA_ONLY_RE.test(text);
}

// ponytail: minimal explicit blocklist (common profanity + violence terms), not a
// comprehensive taxonomy or profanity library. If the pool ever needs stricter
// curation, swap this for a maintained wordlist/library at that point.
//
// Curse roots (fuck/shit/bitch/cunt) match as a left-anchored prefix so compounds
// like "fuckwits" are caught too, since no innocent English word starts with them.
// Everything else matches on both boundaries (`\bword\b`) so it doesn't gut
// innocent words that merely start with the same letters (e.g. "assume", "dickens").
// Word-boundary matching doesn't catch inflections, so those are listed explicitly
// (kill/killing, shoot/shooting, stab/stabbing) rather than relying on a suffix pattern.
const PROFANITY_PREFIXES = ['fuck', 'shit', 'bitch', 'cunt'];
const BLOCKED_WORDS = [
  'asshole',
  'bastard',
  'dick',
  'idiot',
  'kill',
  'killing',
  'shoot',
  'shooting',
  'murder',
  'gun',
  'stab',
  'stabbing',
  'suicide',
  'rape',
];
const BLOCKED_RE = new RegExp(
  `\\b(${PROFANITY_PREFIXES.join('|')})|\\b(${BLOCKED_WORDS.join('|')})\\b`,
  'i',
);

export function isSuitable(translation: string): boolean {
  return !BLOCKED_RE.test(translation);
}

const SKIP_RE = /[、。！？ 　]/;
const SMALL_KANA_RE = /[ゃゅょぁぃぅぇぉャュョァィゥェォ]/;
const SOKUON_RE = /[っッ]/;
const LONG_VOWEL = 'ー';

export function sentenceToEntries(text: string): Entry[] {
  const units: string[] = [];
  let pendingSokuon = '';

  for (const ch of text) {
    if (SKIP_RE.test(ch)) continue;

    if (SOKUON_RE.test(ch)) {
      pendingSokuon = ch;
      continue;
    }

    if (SMALL_KANA_RE.test(ch) || ch === LONG_VOWEL) {
      if (units.length > 0) units[units.length - 1] += ch;
      // ponytail: leading small-kana/long-vowel mark with no preceding unit
      // is unpronounceable and dropped, same ruling as the spec's leading-ー edge case.
      pendingSokuon = '';
      continue;
    }

    units.push(pendingSokuon + ch);
    pendingSokuon = '';
  }
  // trailing sokuon (pendingSokuon left over here) has no following mora and is dropped.

  return units.map((kana) => ({ kana, romaji: toRomaji(kana) }));
}
