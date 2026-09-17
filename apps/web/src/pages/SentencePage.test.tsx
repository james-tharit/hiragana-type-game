import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sentencesData from '../data/sentences.json';
import { sentenceToEntries } from '../data/sentences';
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
const FIRST = sentencesData[0];
const SECOND = sentencesData[150];

function typeSentence(text: string) {
  const tokens = sentenceToEntries(text);
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

  it('renders a sentence from sentences.json together with its matching translation once revealed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /show translation/i }));

    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);
    const strippedKana = FIRST.text.replace(/[、。！？ 　]/g, '');
    expect(screen.getByTestId('input-zone')).toHaveTextContent(strippedKana);
  });

  it('hides the translation by default behind a reveal control', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    expect(screen.queryByTestId('sentence-translation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show translation/i })).toBeInTheDocument();
  });

  it('hides the translation again once Skip loads a new sentence', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.5);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /show translation/i }));
    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    expect(screen.queryByTestId('sentence-translation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show translation/i })).toBeInTheDocument();
  });

  it('speaks the current sentence in Japanese when Listen is clicked and speech is available', () => {
    vi.mocked(speech.canSpeakJapanese).mockReturnValue(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /listen/i }));

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledWith(FIRST.text);
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

  it('loads a different sentence once the typed sentence is finished, with translation hidden again', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.5);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /show translation/i }));
    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);

    typeSentence(FIRST.text);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.queryByTestId('sentence-translation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show translation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show translation/i }));
    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(SECOND.translation);
  });
});
