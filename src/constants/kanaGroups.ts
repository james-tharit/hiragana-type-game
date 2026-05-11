export type Entry = {
  kana: string;
  romaji: string;
};

export type Group = {
  id: string;
  family: string;
  label: string;
  entries: Entry[];
};

export const GROUPS: Group[] = [
  {
    id: 'a-o',
    family: 'Monographs',
    label: 'a-o',
    entries: [
      { kana: 'あ', romaji: 'a' },
      { kana: 'い', romaji: 'i' },
      { kana: 'う', romaji: 'u' },
      { kana: 'え', romaji: 'e' },
      { kana: 'お', romaji: 'o' },
    ],
  },
  {
    id: 'ka-ko',
    family: 'Monographs',
    label: 'ka-ko',
    entries: [
      { kana: 'か', romaji: 'ka' },
      { kana: 'き', romaji: 'ki' },
      { kana: 'く', romaji: 'ku' },
      { kana: 'け', romaji: 'ke' },
      { kana: 'こ', romaji: 'ko' },
    ],
  },
  {
    id: 's-line',
    family: 'Monographs',
    label: 's-line',
    entries: [
      { kana: 'さ', romaji: 'sa' },
      { kana: 'し', romaji: 'shi' },
      { kana: 'す', romaji: 'su' },
      { kana: 'せ', romaji: 'se' },
      { kana: 'そ', romaji: 'so' },
    ],
  },
  {
    id: 'ga-go',
    family: 'Diacritics',
    label: 'ga-go',
    entries: [
      { kana: 'が', romaji: 'ga' },
      { kana: 'ぎ', romaji: 'gi' },
      { kana: 'ぐ', romaji: 'gu' },
      { kana: 'げ', romaji: 'ge' },
      { kana: 'ご', romaji: 'go' },
    ],
  },
  {
    id: 'kya-kyo',
    family: 'Digraphs',
    label: 'kya-kyo',
    entries: [
      { kana: 'きゃ', romaji: 'kya' },
      { kana: 'きゅ', romaji: 'kyu' },
      { kana: 'きょ', romaji: 'kyo' },
    ],
  },
  {
    id: 'sha-sho',
    family: 'Digraphs',
    label: 'sha-sho',
    entries: [
      { kana: 'しゃ', romaji: 'sha' },
      { kana: 'しゅ', romaji: 'shu' },
      { kana: 'しょ', romaji: 'sho' },
    ],
  },
];

export const DEFAULT_GROUPS = ['a-o', 'ka-ko', 's-line'];
export const ROUND_SIZE = 30;

export function createRound(groupIds: string[]): Entry[] {
  const pool = GROUPS.filter((group) => groupIds.includes(group.id)).flatMap((group) => group.entries);
  const safePool = pool.length > 0 ? pool : GROUPS[0].entries;

  return Array.from({ length: ROUND_SIZE }, () => safePool[Math.floor(Math.random() * safePool.length)]!);
}