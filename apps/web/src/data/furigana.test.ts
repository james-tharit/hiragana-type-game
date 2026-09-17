import { describe, expect, it } from 'vitest';
import { alignFurigana, toRubySegments } from './furigana';

describe('alignFurigana', () => {
  const cases: Array<[string, string, ReturnType<typeof alignFurigana>]> = [
    ['彼', 'かれ', [{ text: '彼', reading: 'かれ' }]],
    ['は', 'は', [{ text: 'は' }]],
    ['ます', 'ます', [{ text: 'ます' }]],
    ['。', '。', [{ text: '。' }]],
    ['スケジュール', 'スケジュール', [{ text: 'スケジュール' }]],
    ['忙しかっ', 'いそがしかっ', [{ text: '忙', reading: 'いそが' }, { text: 'しかっ' }]],
    ['飲み', 'のみ', [{ text: '飲', reading: 'の' }, { text: 'み' }]],
    ['行っ', 'いっ', [{ text: '行', reading: 'い' }, { text: 'っ' }]],
    ['お茶', 'おちゃ', [{ text: 'お' }, { text: '茶', reading: 'ちゃ' }]],
    ['東京', 'とうきょう', [{ text: '東京', reading: 'とうきょう' }]],
    ['大人', 'おとな', [{ text: '大人', reading: 'おとな' }]],
    ['取り出す', 'とりだす', [{ text: '取り出', reading: 'とりだ' }, { text: 'す' }]],
    ['１０', 'じゅう', [{ text: '１０', reading: 'じゅう' }]],
    ['ＡＢＣ', 'えーびーしー', [{ text: 'ＡＢＣ', reading: 'えーびーしー' }]],
  ];

  it.each(cases)('aligns %s (%s)', (surface, reading, expected) => {
    expect(alignFurigana(surface, reading)).toEqual(expected);
  });

  it('returns plain segment when reading is empty', () => {
    expect(alignFurigana('彼', '')).toEqual([{ text: '彼' }]);
  });
});

describe('toRubySegments', () => {
  it('returns empty array for no segments', () => {
    expect(toRubySegments([])).toEqual([]);
  });

  it('assigns sequential mora indices to a plain kana segment', () => {
    expect(toRubySegments([{ text: 'ねこ' }])).toEqual([
      {
        text: 'ねこ',
        chars: [
          { char: 'ね', mora: 0 },
          { char: 'こ', mora: 1 },
        ],
      },
    ]);
  });

  it('continues mora indices across a kanji segment and a following plain segment', () => {
    expect(
      toRubySegments([{ text: '猫', reading: 'ねこ' }, { text: 'が' }]),
    ).toEqual([
      {
        text: '猫',
        reading: 'ねこ',
        chars: [
          { char: 'ね', mora: 0 },
          { char: 'こ', mora: 1 },
        ],
      },
      { text: 'が', chars: [{ char: 'が', mora: 2 }] },
    ]);
  });

  it('marks punctuation characters with a null mora', () => {
    expect(toRubySegments([{ text: 'ねこ' }, { text: '。' }])).toEqual([
      {
        text: 'ねこ',
        chars: [
          { char: 'ね', mora: 0 },
          { char: 'こ', mora: 1 },
        ],
      },
      { text: '。', chars: [{ char: '。', mora: null }] },
    ]);
  });

  it('spans a sokuon mora across the segment boundary kuromoji split introduces', () => {
    const result = toRubySegments([
      { text: '行', reading: 'い' },
      { text: 'っ' },
      { text: 'た' },
    ]);
    expect(result).toEqual([
      { text: '行', reading: 'い', chars: [{ char: 'い', mora: 0 }] },
      { text: 'っ', chars: [{ char: 'っ', mora: 1 }] },
      { text: 'た', chars: [{ char: 'た', mora: 1 }] },
    ]);

    const allChars = result.flatMap((seg) => seg.chars);
    expect(allChars.map((c) => c.char).join('')).toBe('いった');
    expect(
      [...new Set(allChars.map((c) => c.mora).filter((m) => m !== null))].sort(),
    ).toEqual([0, 1]);
  });

  it('assigns both characters of a small-kana mora the same index', () => {
    expect(toRubySegments([{ text: 'きゃ' }])).toEqual([
      {
        text: 'きゃ',
        chars: [
          { char: 'き', mora: 0 },
          { char: 'ゃ', mora: 0 },
        ],
      },
    ]);
  });

  it('assigns both characters of a long-vowel mora the same index', () => {
    expect(toRubySegments([{ text: 'コーヒー' }])).toEqual([
      {
        text: 'コーヒー',
        chars: [
          { char: 'コ', mora: 0 },
          { char: 'ー', mora: 0 },
          { char: 'ヒ', mora: 1 },
          { char: 'ー', mora: 1 },
        ],
      },
    ]);
  });

  it('drops a trailing sokuon with no following mora as a null mora', () => {
    expect(toRubySegments([{ text: 'あっ' }])).toEqual([
      {
        text: 'あっ',
        chars: [
          { char: 'あ', mora: 0 },
          { char: 'っ', mora: null },
        ],
      },
    ]);
  });
});
