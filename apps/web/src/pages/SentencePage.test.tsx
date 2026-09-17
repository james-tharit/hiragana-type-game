import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sentencesData from '../data/sentences.json';
import { sentenceToEntries } from '../data/sentences';
import { sentenceReading, sentenceText, type Segment } from '../data/furigana';
import * as speech from '../lib/speech';
import { SentencePage } from './SentencePage';

vi.mock('../lib/speech');

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

  it('speaks the current sentence text (not the reading) in Japanese when Listen is clicked', () => {
    vi.mocked(speech.canSpeakJapanese).mockReturnValue(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listen/i }));

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledWith(sentenceText(SECOND.segments));
  });

  it('renders no Listen button when the browser cannot speak Japanese', () => {
    vi.mocked(speech.canSpeakJapanese).mockReturnValue(false);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    expect(screen.queryByRole('button', { name: /listen/i })).not.toBeInTheDocument();
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
