import { describe, it, expect } from 'vitest';
import { displayFor } from './kanaGroups';

describe('displayFor', () => {
  it('converts a digraph kana entry to its katakana form for the katakana script', () => {
    expect(displayFor('きゃ', 'katakana')).toBe('キャ');
  });

  it('converts a monograph kana entry to its katakana form for the katakana script', () => {
    expect(displayFor('あ', 'katakana')).toBe('ア');
  });

  it('returns the kana unchanged for the hiragana script', () => {
    expect(displayFor('あ', 'hiragana')).toBe('あ');
  });

  it('converts the special kana ん to its katakana form for the katakana script', () => {
    expect(displayFor('ん', 'katakana')).toBe('ン');
  });
});
