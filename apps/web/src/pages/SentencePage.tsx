import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import StatsDisplay from '../components/StatsDisplay';
import TypingCanvas from '../components/TypingCanvas';
import { sentenceToEntries } from '../data/sentences';
import { sentenceReading, toRubySegments, type Segment } from '../data/furigana';
import sentencesData from '../data/sentences.json';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { playSentenceAudio } from '../lib/audio';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

type Sentence = {
  id: number;
  segments: Segment[];
  translation: string;
  audio?: { id: number; by: string; license: string };
};

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
  const [tokens, setTokens] = useState(() => sentenceToEntries(sentenceReading(sentence.segments)));
  const [translationRevealed, setTranslationRevealed] = useState(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const rubySegments = useMemo(() => toRubySegments(sentence.segments), [sentence.segments]);

  const loadSentence = (next: Sentence) => {
    setSentence(next);
    setTokens(sentenceToEntries(sentenceReading(next.segments)));
    setTranslationRevealed(true);
  };

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
    toplineVisible,
    toggleTopline,
  } = useTypingEngine(tokens, undefined, true);

  const handleListen = async () => {
    if (!sentence.audio) return;
    setIsLoadingAudio(true);
    try {
      await playSentenceAudio(sentence.audio.id);
    } catch {
      // playback failed (offline, blocked autoplay) — loading state still clears below
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const nextSentence = () => {
    loadSentence(pickSentence(sentence.id));
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

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-bark sm:px-8">
        <section className="rounded-3xl border border-moss/20 bg-sand/60 p-6 shadow-[0_18px_50px_rgba(42,124,19,0.13)] backdrop-blur">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sentence Practice</h1>
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleListen}
                  disabled={!sentence.audio || isLoadingAudio}
                  title={sentence.audio ? undefined : 'Audio is not available for this sentence'}
                  className="rounded-xl border border-moss/30 bg-sand px-4 py-2 text-sm font-medium text-bark transition hover:bg-leaf/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingAudio ? 'Loading…' : 'Listen'}
                </button>
                <button
                  type="button"
                  onClick={nextSentence}
                  className="rounded-xl border border-moss/30 bg-sand px-4 py-2 text-sm font-medium text-bark transition hover:bg-leaf/40"
                >
                  Skip
                </button>
              </div>
              {sentence.audio && (
                <p className="text-sm text-sage" data-testid="audio-credit">
                  Audio by {sentence.audio.by}
                  {sentence.audio.license ? ` · ${sentence.audio.license}` : ''}
                </p>
              )}
            </div>
          </header>

          <div className="relative">
            <TypingCanvas
              tokens={tokens}
              segments={rubySegments}
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
              toplineVisible={toplineVisible}
              toggleTopline={toggleTopline}
              onRestart={resetEngine}
              inputZoneRef={inputZoneRef}
              setIsFocused={setIsFocused}
              isFocused={isFocused}
            />
            <div
              className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl border border-moss/20 bg-cream/95 p-8 backdrop-blur-sm transition-opacity duration-500 sm:p-10 ${
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {translationRevealed && (
              <p className="text-sm text-sage" data-testid="sentence-translation">
                {sentence.translation}
              </p>
            )}
            <button
              type="button"
              onClick={() => setTranslationRevealed((revealed) => !revealed)}
              className="rounded-lg border border-moss/30 bg-sand px-2 py-1 text-xs font-medium text-bark transition hover:bg-leaf/40"
            >
              {translationRevealed ? 'Hide translation' : 'Show translation'}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
