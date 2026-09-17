import { execFileSync } from 'node:child_process';
import { createReadStream, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { toHiragana } from 'wanakana';
import { isKanaOnly, isSuitable, sentenceToEntries } from '../apps/web/src/data/sentences.ts';
import { alignFurigana, sentenceReading, type Segment } from '../apps/web/src/data/furigana.ts';

const require = createRequire(import.meta.url);
const kuromoji = require('kuromoji');

const BASE = 'https://downloads.tatoeba.org/exports';
const FILES = {
  jpn: 'per_language/jpn/jpn_sentences.tsv.bz2',
  links: 'per_language/jpn/jpn-eng_links.tsv.bz2',
  eng: 'per_language/eng/eng_sentences.tsv.bz2',
} as const;

const MIN_ENTRIES = 4;
const MAX_ENTRIES = 40;
const CAP = 300;
const OUTPUT = path.join(import.meta.dirname, '../apps/web/src/data/sentences.json');

function download(dir: string, name: string, relUrl: string): string {
  const dest = path.join(dir, `${name}.tsv.bz2`);
  execFileSync('curl', ['-sSL', '-o', dest, `${BASE}/${relUrl}`]);
  execFileSync('bunzip2', [dest]);
  return path.join(dir, `${name}.tsv`);
}

function buildTokenizer(): Promise<any> {
  const dicPath = path.join(require.resolve('kuromoji'), '../../dict');
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err: Error, tokenizer: any) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}

function readingOf(token: { reading?: string; surface_form: string }): string {
  return toHiragana(token.reading ?? token.surface_form);
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), 'tatoeba-'));
  try {
    const jpnPath = download(dir, 'jpn', FILES.jpn);
    const linksPath = download(dir, 'links', FILES.links);
    const engPath = download(dir, 'eng', FILES.eng);

    for (const [label, p] of [
      ['jpn_sentences', jpnPath],
      ['jpn-eng_links', linksPath],
      ['eng_sentences', engPath],
    ] as const) {
      const head = readFileSync(p, 'utf8').split('\n', 2).join('\n');
      console.log(`--- ${label} head ---\n${head}`);
    }

    let jpnScanned = 0;
    const jpnText = new Map<string, string>(); // jpn id -> text, insertion order preserved
    for (const line of readFileSync(jpnPath, 'utf8').split('\n')) {
      if (!line) continue;
      jpnScanned++;
      const [id, , text] = line.split('\t');
      jpnText.set(id, text);
    }

    const linkedEngId = new Map<string, string>(); // jpn id -> eng id
    for (const line of readFileSync(linksPath, 'utf8').split('\n')) {
      if (!line) continue;
      const [jpnId, engId] = line.split('\t');
      if (jpnText.has(jpnId) && !linkedEngId.has(jpnId)) linkedEngId.set(jpnId, engId);
    }
    const neededEngIds = new Set(linkedEngId.values());

    const engText = new Map<string, string>();
    const rl = createInterface({ input: createReadStream(engPath, 'utf8') });
    for await (const line of rl) {
      if (!line) continue;
      const [id, , text] = line.split('\t');
      if (neededEngIds.has(id)) engText.set(id, text);
    }

    const tokenizer = await buildTokenizer();

    let withTranslation = 0;
    let suitable = 0;
    let tokenized = 0;
    let alignable = 0;
    let withinLength = 0;
    type Row = { id: number; segments: Segment[]; translation: string };
    const rows: Row[] = [];
    const seenText = new Set<string>();

    for (const [jpnId, text] of jpnText) {
      if (rows.length >= CAP) break;

      const engId = linkedEngId.get(jpnId);
      const translation = engId ? engText.get(engId) : undefined;
      if (!translation) continue;
      withTranslation++;
      if (!isSuitable(translation)) continue;
      suitable++;
      if (seenText.has(text)) continue;

      const tokens = tokenizer.tokenize(text);
      if (tokens.some((t: any) => t.word_type !== 'KNOWN')) continue;
      tokenized++;

      const segments = tokens.flatMap((t: any) => alignFurigana(t.surface_form, readingOf(t)));
      const reading = sentenceReading(segments);
      if (!isKanaOnly(reading)) continue;
      alignable++;

      const count = sentenceToEntries(reading).length;
      if (count < MIN_ENTRIES || count > MAX_ENTRIES) continue;
      withinLength++;

      seenText.add(text);
      rows.push({ id: Number(jpnId), segments, translation });
    }

    rows.sort((a, b) => a.id - b.id);

    writeFileSync(OUTPUT, `${JSON.stringify(rows, null, 2)}\n`);

    console.log(
      `scanned ${jpnScanned} jpn sentences → ${withTranslation} with translation → ${suitable} suitable → ${tokenized} known-word → ${alignable} kana-only reading → ${withinLength} within length range → ${rows.length} written`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
