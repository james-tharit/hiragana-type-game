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
    id: 'sa-so',
    family: 'Monographs',
    label: 'sa-so',
    entries: [
      { kana: 'さ', romaji: 'sa' },
      { kana: 'し', romaji: 'shi' },
      { kana: 'す', romaji: 'su' },
      { kana: 'せ', romaji: 'se' },
      { kana: 'そ', romaji: 'so' },
    ],
  },
  {
    id: 'ta-to',
    family: 'Monographs',
    label: 'ta-to',
    entries: [
      { kana: 'た', romaji: 'ta' },
      { kana: 'ち', romaji: 'chi' },
      { kana: 'つ', romaji: 'tsu' },
      { kana: 'て', romaji: 'te' },
      { kana: 'と', romaji: 'to' },
    ],
  },
  {
    id: 'na-no',
    family: 'Monographs',
    label: 'na-no',
    entries: [
      { kana: 'な', romaji: 'na' },
      { kana: 'に', romaji: 'ni' },
      { kana: 'ぬ', romaji: 'nu' },
      { kana: 'ね', romaji: 'ne' },
      { kana: 'の', romaji: 'no' },
    ],
  },
  {
    id: 'ha-ho',
    family: 'Monographs',
    label: 'ha-ho',
    entries: [
      { kana: 'は', romaji: 'ha' },
      { kana: 'ひ', romaji: 'hi' },
      { kana: 'ふ', romaji: 'fu' },
      { kana: 'へ', romaji: 'he' },
      { kana: 'ほ', romaji: 'ho' },
    ],
  },
  {
    id: 'ma-mo',
    family: 'Monographs',
    label: 'ma-mo',
    entries: [
      { kana: 'ま', romaji: 'ma' },
      { kana: 'み', romaji: 'mi' },
      { kana: 'む', romaji: 'mu' },
      { kana: 'め', romaji: 'me' },
      { kana: 'も', romaji: 'mo' },
    ],
  },
  {
    id: 'ya-yo',
    family: 'Monographs',
    label: 'ya-yo',
    entries: [
      { kana: 'や', romaji: 'ya' },
      { kana: 'ゆ', romaji: 'yu' },
      { kana: 'よ', romaji: 'yo' },
    ],
  },
  {
    id: 'ra-ro',
    family: 'Monographs',
    label: 'ra-ro',
    entries: [
      { kana: 'ら', romaji: 'ra' },
      { kana: 'り', romaji: 'ri' },
      { kana: 'る', romaji: 'ru' },
      { kana: 'れ', romaji: 're' },
      { kana: 'ろ', romaji: 'ro' },
    ],
  },
  {
    id: 'wa-n',
    family: 'Monographs',
    label: 'wa-n',
    entries: [
      { kana: 'わ', romaji: 'wa' },
      { kana: 'を', romaji: 'wo' },
      { kana: 'ん', romaji: 'n' },
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
    id: 'za-zo',
    family: 'Diacritics',
    label: 'za-zo',
    entries: [
      { kana: 'ざ', romaji: 'za' },
      { kana: 'じ', romaji: 'ji' },
      { kana: 'ず', romaji: 'zu' },
      { kana: 'ぜ', romaji: 'ze' },
      { kana: 'ぞ', romaji: 'zo' },
    ],
  },
  {
    id: 'da-do',
    family: 'Diacritics',
    label: 'da-do',
    entries: [
      { kana: 'だ', romaji: 'da' },
      { kana: 'ぢ', romaji: 'ji' },
      { kana: 'づ', romaji: 'zu' },
      { kana: 'で', romaji: 'de' },
      { kana: 'ど', romaji: 'do' },
    ],
  },
  {
    id: 'ba-bo',
    family: 'Diacritics',
    label: 'ba-bo',
    entries: [
      { kana: 'ば', romaji: 'ba' },
      { kana: 'び', romaji: 'bi' },
      { kana: 'ぶ', romaji: 'bu' },
      { kana: 'べ', romaji: 'be' },
      { kana: 'ぼ', romaji: 'bo' },
    ],
  },
  {
    id: 'pa-po',
    family: 'Diacritics',
    label: 'pa-po',
    entries: [
      { kana: 'ぱ', romaji: 'pa' },
      { kana: 'ぴ', romaji: 'pi' },
      { kana: 'ぷ', romaji: 'pu' },
      { kana: 'ぺ', romaji: 'pe' },
      { kana: 'ぽ', romaji: 'po' },
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
  {
    id: 'cha-cho',
    family: 'Digraphs',
    label: 'cha-cho',
    entries: [
      { kana: 'ちゃ', romaji: 'cha' },
      { kana: 'ちゅ', romaji: 'chu' },
      { kana: 'ちょ', romaji: 'cho' },
    ],
  },
  {
    id: 'nya-nyo',
    family: 'Digraphs',
    label: 'nya-nyo',
    entries: [
      { kana: 'にゃ', romaji: 'nya' },
      { kana: 'にゅ', romaji: 'nyu' },
      { kana: 'にょ', romaji: 'nyo' },
    ],
  },
  {
    id: 'hya-hyo',
    family: 'Digraphs',
    label: 'hya-hyo',
    entries: [
      { kana: 'ひゃ', romaji: 'hya' },
      { kana: 'ひゅ', romaji: 'hyu' },
      { kana: 'ひょ', romaji: 'hyo' },
    ],
  },
  {
    id: 'mya-myo',
    family: 'Digraphs',
    label: 'mya-myo',
    entries: [
      { kana: 'みゃ', romaji: 'mya' },
      { kana: 'みゅ', romaji: 'myu' },
      { kana: 'みょ', romaji: 'myo' },
    ],
  },
  {
    id: 'rya-ryo',
    family: 'Digraphs',
    label: 'rya-ryo',
    entries: [
      { kana: 'りゃ', romaji: 'rya' },
      { kana: 'りゅ', romaji: 'ryu' },
      { kana: 'りょ', romaji: 'ryo' },
    ],
  },
  {
    id: 'gya-gyo',
    family: 'Digraphs',
    label: 'gya-gyo',
    entries: [
      { kana: 'ぎゃ', romaji: 'gya' },
      { kana: 'ぎゅ', romaji: 'gyu' },
      { kana: 'ぎょ', romaji: 'gyo' },
    ],
  },
  {
    id: 'ja-jo',
    family: 'Digraphs',
    label: 'ja-jo',
    entries: [
      { kana: 'じゃ', romaji: 'ja' },
      { kana: 'じゅ', romaji: 'ju' },
      { kana: 'じょ', romaji: 'jo' },
    ],
  },
  {
    id: 'bya-byo',
    family: 'Digraphs',
    label: 'bya-byo',
    entries: [
      { kana: 'びゃ', romaji: 'bya' },
      { kana: 'びゅ', romaji: 'byu' },
      { kana: 'びょ', romaji: 'byo' },
    ],
  },
  {
    id: 'pya-pyo',
    family: 'Digraphs',
    label: 'pya-pyo',
    entries: [
      { kana: 'ぴゃ', romaji: 'pya' },
      { kana: 'ぴゅ', romaji: 'pyu' },
      { kana: 'ぴょ', romaji: 'pyo' },
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