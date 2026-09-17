import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sentencesData from '../data/sentences.json';
import { sentenceToEntries } from '../data/sentences';
import { sentenceReading, type Segment } from '../data/furigana';
import { SentencePage } from './SentencePage';

// Index 150 (SECOND) gets an `audio` key with an empty license, index 200
// (THIRD) gets one with a license, and index 0 (FIRST) has its audio stripped
// so the no-audio path stays testable — the real pool is audio-backed
// throughout, since the refresh script ranks recorded sentences first.
vi.mock('../data/sentences.json', async (importOriginal) => {
  const actual = (await importOriginal()) as { default: Array<Record<string, unknown>> };
  const data = actual.default.map((entry, i) => {
    if (i === 0) {
      const { audio: _noAudio, ...rest } = entry;
      return rest;
    }
    if (i === 150) return { ...entry, audio: { id: 999150, by: 'CK', license: '' } };
    if (i === 200) return { ...entry, audio: { id: 999200, by: 'yomi', license: 'CC BY-NC 4.0' } };
    return entry;
  });
  return { default: data };
});

const renderPage = () =>
  render(
    <HelmetProvider>
      <SentencePage />
    </HelmetProvider>,
  );

// index 0 and index 150 are guaranteed distinct entries in sentences.json,
// used to drive Math.random deterministically so tests never depend on which
// sentence was actually picked at runtime.
const FIRST = sentencesData[0] as { id: number; segments: Segment[]; translation: string };
const SECOND = sentencesData[150] as { id: number; segments: Segment[]; translation: string };

function typeSentence(segments: Segment[]) {
  const tokens = sentenceToEntries(sentenceReading(segments));
  for (const token of tokens) {
    for (const char of token.romaji) {
      fireEvent.keyDown(window, { key: char });
    }
  }
}

describe('SentencePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the sentence as ruby with the reading, matching the typed input', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // SECOND has kanji + readings
    renderPage();

    const kanjiSegment = SECOND.segments.find((s) => s.reading);
    const ruby = document.querySelector('ruby');
    expect(ruby).toBeInTheDocument();
    expect(ruby).toHaveTextContent(kanjiSegment!.text);
    expect(ruby?.querySelector('rt')).toHaveTextContent(kanjiSegment!.reading!);
  });

  it('shows the translation below the typing canvas by default, with no click needed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    const translation = screen.getByTestId('sentence-translation');
    expect(translation).toHaveTextContent(FIRST.translation);

    const position = screen.getByTestId('input-zone').compareDocumentPosition(translation);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides the translation when the toggle is clicked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /hide translation/i }));

    expect(screen.queryByTestId('sentence-translation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show translation/i })).toBeInTheDocument();
  });

  it('resets the translation back to visible once Skip loads a new sentence', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.5);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /hide translation/i }));
    expect(screen.queryByTestId('sentence-translation')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(SECOND.translation);
    expect(screen.getByRole('button', { name: /hide translation/i })).toBeInTheDocument();
  });

  it('plays the current sentence audio when Listen is clicked', () => {
    const play = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listen/i }));

    expect(play).toHaveBeenCalledTimes(1);
    const audio = play.mock.instances[0] as unknown as HTMLAudioElement;
    expect(audio.src).toBe('https://tatoeba.org/audio/download/999150');
  });

  it('disables Listen with a tooltip when the sentence has no recorded audio', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // FIRST has no audio key
    renderPage();

    const listenButton = screen.getByRole('button', { name: /listen/i });
    expect(listenButton).toBeDisabled();
    expect(listenButton).toHaveAttribute('title', 'Audio is not available for this sentence');
  });

  it('enables Listen with no tooltip when the sentence has recorded audio', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // SECOND has an audio key
    renderPage();

    const listenButton = screen.getByRole('button', { name: /listen/i });
    expect(listenButton).not.toBeDisabled();
    expect(listenButton).not.toHaveAttribute('title');
  });

  it('credits the recording contributor and license near Listen when the sentence has audio', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6667); // THIRD has audio with a license
    renderPage();

    const credit = screen.getByTestId('audio-credit');
    expect(credit).toHaveTextContent('yomi');
    expect(credit).toHaveTextContent('CC BY-NC 4.0');
  });

  it('credits just the contributor, with no dangling separator or "undefined", when the recording has no license', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // SECOND has audio, license: ''
    renderPage();

    const credit = screen.getByTestId('audio-credit');
    expect(credit).toHaveTextContent('CK');
    expect(credit.textContent).not.toMatch(/undefined/);
    expect(credit.textContent?.trim()).not.toMatch(/[·-]\s*$/);
  });

  it('renders no credit line when the sentence has no recorded audio', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // FIRST has no audio key
    renderPage();

    expect(screen.queryByTestId('audio-credit')).not.toBeInTheDocument();
  });

  it('does not render the CharacterFilter kana-group picker', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    expect(screen.queryByRole('button', { name: /show filters/i })).not.toBeInTheDocument();
  });

  it('pressing Tab hides the furigana reading, pressing Tab again shows it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // SECOND has kanji + readings
    renderPage();

    expect(document.querySelector('rt')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.querySelector('rt')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.querySelector('rt')).toBeInTheDocument();
  });

  it('pressing Space restarts the current sentence: progress resets, sentence unchanged', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // SECOND
    renderPage();

    const tokens = sentenceToEntries(sentenceReading(SECOND.segments));
    fireEvent.keyDown(window, { key: tokens[0].romaji[0] });

    const inputZone = screen.getByTestId('input-zone');
    const romajiSpan = () => inputZone.querySelectorAll('p')[0].querySelector('span')!;
    expect(romajiSpan().textContent).not.toBe('...');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(romajiSpan().textContent).toBe('...');
    const kanjiSegment = SECOND.segments.find((s) => s.reading);
    expect(document.querySelector('ruby')).toHaveTextContent(kanjiSegment!.text);
  });

  it('loads a different sentence once the typed sentence is finished, with translation visible again', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.5);

    renderPage();
    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);

    typeSentence(FIRST.segments);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(SECOND.translation);
  });
});
