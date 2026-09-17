import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import StatsDisplay from '../components/StatsDisplay';
import TypingCanvas from '../components/TypingCanvas';
import { sentenceToEntries } from '../data/sentences';
import sentencesData from '../data/sentences.json';
import { useTypingEngine } from '../hooks/useTypingEngine';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

type Sentence = { id: number; text: string; translation: string };

const sentences = sentencesData as Sentence[];

function pickSentence(excludeId?: number): Sentence {
  let candidate = sentences[Math.floor(Math.random() * sentences.length)];
  while (excludeId !== undefined && candidate.id === excludeId && sentences.length > 1) {
    candidate = sentences[Math.floor(Math.random() * sentences.length)];
  }
  return candidate;
}

export function SentencePage() {
  const inputZoneRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [sentence, setSentence] = useState(() => pickSentence());
  const [tokens, setTokens] = useState(() => sentenceToEntries(sentence.text));

  const {
    index,
    buffer,
    composedKana,
    totalKeystrokes,
    mistakeKeystrokes,
    currentWrong,
    isFinished,
    accuracy,
    resetEngine,
    hasFailedOnce,
    targetRevealed,
    revealTarget,
  } = useTypingEngine(tokens, () => {
    const next = pickSentence(sentence.id);
    setSentence(next);
    setTokens(sentenceToEntries(next.text));
  });

  const nextSentence = () => {
    const next = pickSentence(sentence.id);
    setSentence(next);
    setTokens(sentenceToEntries(next.text));
    resetEngine();
  };

  // Focus the input zone on any character key press so the overlay dismisses
  // even when the div is not already the active element.
  // ponytail: near-identical to PracticePage's version but under the ~20-line
  // extraction threshold set for this cycle — inline copy, not a shared hook.
  const focusInputOnWindowKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (!isFocused || document.activeElement !== inputZoneRef.current) {
        if (event.key.length === 1) {
          inputZoneRef.current?.focus();
          event.preventDefault();
        }
      }
    },
    [isFocused],
  );

  useEffect(() => {
    window.addEventListener('keydown', focusInputOnWindowKeyDown);
    return () => window.removeEventListener('keydown', focusInputOnWindowKeyDown);
  }, [focusInputOnWindowKeyDown]);

  return (
    <>
      <Helmet>
        <title>Japanese Sentence Typing Practice — Wakana Type</title>
        <meta
          name="description"
          content="Type real Japanese sentences from the Tatoeba corpus in romaji, with English translations. Free browser trainer — no sign-up required."
        />
        <link rel="canonical" href={`${SITE_URL}/sentences`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/sentences`} />
        <meta property="og:title" content="Japanese Sentence Typing Practice — Wakana Type" />
        <meta property="og:description" content="Type real Japanese sentences from the Tatoeba corpus in romaji, with English translations." />
        <meta property="og:image" content={`${SITE_URL}/og-sentences.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Japanese Sentence Typing Practice — Wakana Type" />
        <meta name="twitter:description" content="Type real Japanese sentences from the Tatoeba corpus in romaji, with English translations." />
        <meta name="twitter:image" content={`${SITE_URL}/og-sentences.png`} />
      </Helmet>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sentence Practice</h1>
              <p className="mt-1 text-sm text-ink-500" data-testid="sentence-translation">
                {sentence.translation}
              </p>
            </div>
            <button
              type="button"
              onClick={nextSentence}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Skip
            </button>
          </header>

          <div className="relative">
            <TypingCanvas
              tokens={tokens}
              // ponytail: sentences already mix hiragana/katakana as written;
              // running them through the katakana transform would mangle
              // real words, so "hiragana" (the identity case) is intentional
              // here and must not read FilterContext's script.
              script="hiragana"
              index={index}
              buffer={buffer}
              composedKana={composedKana}
              currentWrong={currentWrong}
              isFinished={isFinished}
              accuracy={accuracy}
              hasFailedOnce={hasFailedOnce}
              targetRevealed={targetRevealed}
              revealTarget={revealTarget}
              inputZoneRef={inputZoneRef}
              setIsFocused={setIsFocused}
              isFocused={isFocused}
            />
            <div
              className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/80 p-8 backdrop-blur-sm transition-opacity duration-500 sm:p-10 ${
                isFinished ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              <StatsDisplay
                progress={index}
                total={tokens.length}
                accuracy={accuracy}
                mistakeKeystrokes={mistakeKeystrokes}
                totalKeystrokes={totalKeystrokes}
                onRetry={nextSentence}
                isFinished={isFinished}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
