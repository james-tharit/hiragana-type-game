import { describe, expect, it } from 'vitest';
import { isKanaOnly, isSuitable, sentenceToEntries } from './sentences';
import { sentenceReading, sentenceText } from './furigana';
import sentences from './sentences.json';

const HAN_RE = /\p{Script=Han}/u;
const KATAKANA_RE = /\p{Script=Katakana}/u;

describe('isKanaOnly', () => {
  it('accepts a hiragana-only sentence with punctuation', () => {
    expect(isKanaOnly('ねこがすきです。')).toBe(true);
  });

  it('rejects a sentence containing kanji', () => {
    expect(isKanaOnly('猫が好きです。')).toBe(false);
  });

  it('accepts katakana with the long-vowel mark and particle wo', () => {
    expect(isKanaOnly('コーヒーをのみます。')).toBe(true);
  });

  it('rejects non-Japanese text', () => {
    expect(isKanaOnly('Hello')).toBe(false);
  });

  it('rejects digits', () => {
    expect(isKanaOnly('ねこ123')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isKanaOnly('')).toBe(false);
  });
});

describe('isSuitable', () => {
  it('keeps a greeting containing "hell" as a substring', () => {
    expect(isSuitable('Hello, Tom. Good morning.')).toBe(true);
  });

  it('keeps a sentence about dieting containing "die" as a substring', () => {
    expect(isSuitable("I have to lose weight, so I'm on a diet.")).toBe(true);
  });

  it('keeps a sentence containing "ass" as a substring', () => {
    expect(isSuitable('Please pass the salt.')).toBe(true);
  });

  it('drops a sentence threatening violence with the word shoot', () => {
    expect(isSuitable("I'm gonna shoot him.")).toBe(false);
  });

  it('drops a sentence containing profanity', () => {
    expect(isSuitable("I'm surrounded by fuckwits!")).toBe(false);
  });
});

describe('sentenceToEntries', () => {
  it('groups a small kana with its preceding character as one mora', () => {
    expect(sentenceToEntries('きゃ')).toEqual([{ kana: 'きゃ', romaji: 'kya' }]);
  });

  it('attaches sokuon to the following mora, composing multiple units', () => {
    const entries = sentenceToEntries('がっこう');
    expect(entries.map((e) => e.kana)).toEqual(['が', 'っこ', 'う']);
    expect(entries.map((e) => e.romaji)).toEqual(['ga', 'kko', 'u']);
  });

  it('skips punctuation without producing an entry for it', () => {
    const entries = sentenceToEntries('ねこ。');
    expect(entries).toHaveLength(2);
    expect(entries.some((e) => e.kana.includes('。'))).toBe(false);
  });

  it('skips spaces without turning them into entries', () => {
    expect(sentenceToEntries('ねこ が すき')).toHaveLength(5);
  });

  it('attaches the long-vowel mark to the preceding character', () => {
    const entries = sentenceToEntries('コーヒー');
    expect(entries.map((e) => e.kana)).toEqual(['コー', 'ヒー']);
    expect(entries.map((e) => e.romaji)).toEqual(['koo', 'hii']);
  });

  it('returns an empty array for an empty string', () => {
    expect(sentenceToEntries('')).toEqual([]);
  });

  it('returns an empty array for punctuation-only input', () => {
    expect(sentenceToEntries('。、')).toEqual([]);
  });

  it('drops a trailing sokuon with no following mora', () => {
    expect(sentenceToEntries('あっ')).toHaveLength(1);
  });

  it('reproduces the input with punctuation and spaces stripped when kana are joined', () => {
    const entries = sentenceToEntries('がっこうへいきます。');
    expect(entries.map((e) => e.kana).join('')).toBe('がっこうへいきます');
  });
});

describe('committed sentence pool', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(sentences)).toBe(true);
    expect(sentences.length).toBeGreaterThan(0);
  });

  it('has a kana-only reading for every entry', () => {
    for (const s of sentences) {
      expect(isKanaOnly(sentenceReading(s.segments))).toBe(true);
    }
  });

  it('has a non-empty, kana-only reading and non-empty text on every segment that has a reading', () => {
    for (const s of sentences) {
      for (const seg of s.segments) {
        expect(seg.text.length).toBeGreaterThan(0);
        if (seg.reading !== undefined) {
          expect(isKanaOnly(seg.reading)).toBe(true);
        }
      }
    }
  });

  it('produces non-empty display text for every entry', () => {
    for (const s of sentences) {
      expect(sentenceText(s.segments).length).toBeGreaterThan(0);
    }
  });

  it('has a non-empty translation for every entry', () => {
    for (const s of sentences) {
      expect(s.translation).toBeTruthy();
    }
  });

  it('produces only typeable romaji for every entry', () => {
    for (const s of sentences) {
      const entries = sentenceToEntries(sentenceReading(s.segments));
      expect(entries.length).toBeGreaterThan(0);
      for (const e of entries) {
        expect(e.romaji).toBeTruthy();
        expect(e.romaji).toMatch(/^[a-z'-]+$/);
      }
    }
  });

  it('has unique ids', () => {
    const ids = sentences.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains only translations that pass the content filter', () => {
    for (const s of sentences) {
      expect(isSuitable(s.translation)).toBe(true);
    }
  });

  it('has exactly 300 entries', () => {
    expect(sentences.length).toBe(300);
  });

  it('renders kanji in at least 200 of the 300 entries', () => {
    const withKanji = sentences.filter((s) => HAN_RE.test(sentenceText(s.segments)));
    expect(withKanji.length).toBeGreaterThanOrEqual(200);
  });

  it('renders katakana in at least 15 of the 300 entries', () => {
    const withKatakana = sentences.filter((s) => KATAKANA_RE.test(sentenceText(s.segments)));
    expect(withKatakana.length).toBeGreaterThanOrEqual(15);
  });
});
