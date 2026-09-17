import { execFileSync } from 'node:child_process';
import { createReadStream, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isKanaOnly, isSuitable, sentenceToEntries } from '../apps/web/src/data/sentences.ts';

const BASE = 'https://downloads.tatoeba.org/exports';
const FILES = {
  jpn: 'per_language/jpn/jpn_sentences.tsv.bz2',
  links: 'per_language/jpn/jpn-eng_links.tsv.bz2',
  eng: 'per_language/eng/eng_sentences.tsv.bz2',
} as const;

const MIN_ENTRIES = 4;
const MAX_ENTRIES = 40;
const CAP = 300;
const OUTPUT = path.join(import.meta.dirname, '../src/data/sentences.json');

function download(dir: string, name: string, relUrl: string): string {
  const dest = path.join(dir, `${name}.tsv.bz2`);
  execFileSync('curl', ['-sSL', '-o', dest, `${BASE}/${relUrl}`]);
  execFileSync('bunzip2', [dest]);
  return path.join(dir, `${name}.tsv`);
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
    const kanaOnly = new Map<string, string>(); // jpn id -> text, insertion order preserved
    for (const line of readFileSync(jpnPath, 'utf8').split('\n')) {
      if (!line) continue;
      jpnScanned++;
      const [id, , text] = line.split('\t');
      if (isKanaOnly(text)) kanaOnly.set(id, text);
    }

    const linkedEngId = new Map<string, string>(); // jpn id -> eng id
    for (const line of readFileSync(linksPath, 'utf8').split('\n')) {
      if (!line) continue;
      const [jpnId, engId] = line.split('\t');
      if (kanaOnly.has(jpnId) && !linkedEngId.has(jpnId)) linkedEngId.set(jpnId, engId);
    }
    const neededEngIds = new Set(linkedEngId.values());

    const engText = new Map<string, string>();
    const rl = createInterface({ input: createReadStream(engPath, 'utf8') });
    for await (const line of rl) {
      if (!line) continue;
      const [id, , text] = line.split('\t');
      if (neededEngIds.has(id)) engText.set(id, text);
    }

    let withTranslation = 0;
    let suitable = 0;
    let withinLength = 0;
    type Row = { id: number; text: string; translation: string };
    const rows: Row[] = [];
    for (const [jpnId, text] of kanaOnly) {
      const engId = linkedEngId.get(jpnId);
      const translation = engId ? engText.get(engId) : undefined;
      if (!translation) continue;
      withTranslation++;
      if (!isSuitable(translation)) continue;
      suitable++;
      const count = sentenceToEntries(text).length;
      if (count < MIN_ENTRIES || count > MAX_ENTRIES) continue;
      withinLength++;
      rows.push({ id: Number(jpnId), text, translation });
    }

    const seenText = new Set<string>();
    const deduped = rows.filter((r) => {
      if (seenText.has(r.text)) return false;
      seenText.add(r.text);
      return true;
    });

    deduped.sort((a, b) => a.id - b.id);
    const final = deduped.slice(0, CAP);

    writeFileSync(OUTPUT, `${JSON.stringify(final, null, 2)}\n`);

    console.log(
      `scanned ${jpnScanned} jpn sentences → ${kanaOnly.size} kana-only → ${withTranslation} with translation → ${suitable} suitable → ${withinLength} within length range → ${deduped.length} deduped → ${final.length} written`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
