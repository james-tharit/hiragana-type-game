import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sentencesData from '../data/sentences.json';
import { sentenceToEntries } from '../data/sentences';
import { SentencePage } from './SentencePage';

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

  it('renders a sentence from sentences.json together with its matching translation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);
    const strippedKana = FIRST.text.replace(/[、。！？ 　]/g, '');
    expect(screen.getByTestId('input-zone')).toHaveTextContent(strippedKana);
  });

  it('does not render the CharacterFilter kana-group picker', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderPage();

    expect(screen.queryByRole('button', { name: /show filters/i })).not.toBeInTheDocument();
  });

  it('loads a different sentence once the typed sentence is finished', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.5);

    renderPage();
    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(FIRST.translation);

    typeSentence(FIRST.text);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByTestId('sentence-translation')).toHaveTextContent(SECOND.translation);
    expect(screen.getByTestId('sentence-translation')).not.toHaveTextContent(FIRST.translation);
  });
});
