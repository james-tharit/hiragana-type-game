import { describe, expect, it } from 'vitest';
import { byAudioFirst, parseAudioTsv } from './refresh-sentences.ts';

describe('parseAudioTsv', () => {
  it('maps sentence id to uploader and license, defaulting an empty license field to an empty string', () => {
    const lines = ['4704\t1682\tyomi\tCC BY-NC 4.0\t', '4739\t750950\tlowteq\t\t'];

    const audioById = parseAudioTsv(lines);

    expect(audioById.get('4704')).toEqual({ id: 1682, by: 'yomi', license: 'CC BY-NC 4.0' });
    expect(audioById.get('4739')).toEqual({ id: 750950, by: 'lowteq', license: '' });
  });

  it('carries the recording audio id, distinct from the sentence id used as the map key', () => {
    const lines = ['4704\t1682\tyomi\tCC BY-NC 4.0\t'];

    const audioById = parseAudioTsv(lines);

    expect(audioById.get('4704')?.id).toBe(1682);
  });
});

describe('byAudioFirst', () => {
  it('orders audio-backed candidates before candidates without audio, preserving relative order within each group', () => {
    const hasAudio = (id: string) => id === '2' || id === '4';

    const ordered = byAudioFirst(['1', '2', '3', '4', '5'], hasAudio);

    expect(ordered).toEqual(['2', '4', '1', '3', '5']);
  });
});
