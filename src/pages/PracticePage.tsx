import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import CharacterFilter from '../components/CharacterFilter';
import StatsDisplay from '../components/StatsDisplay';
import TypingCanvas from '../components/TypingCanvas';
import { createRound, GROUPS } from '../constants/kanaGroups';
import { useFilterContext } from '../contexts/FilterContext';
import { useTypingEngine } from '../hooks/useTypingEngine';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

export function PracticePage() {
  const { selectedGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily } = useFilterContext();

  const inputZoneRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Initialize tokens from the current filter selection (picked up from context
  // even if the user changed filters while on ArcadePage).
  const [tokens, setTokens] = useState(() => createRound(selectedGroupIds));

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
  } = useTypingEngine(tokens, () => setTokens(createRound(selectedGroupIds)));

  const targetKanaLength = useMemo(
    () => tokens.reduce((sum, token) => sum + token.kana.length, 0),
    [tokens],
  );

  // Keep a stable ref to resetEngine so the filter-change effect below can
  // always call the latest version without listing it as a dep (it is a new
  // function reference on every render since it isn't memoised in the hook).
  const resetEngineRef = useRef(resetEngine);
  useEffect(() => {
    resetEngineRef.current = resetEngine;
  });

  // When the shared filter selection changes, create a fresh round and reset
  // the engine. The ref guard skips the initial mount so we don't double-create
  // the first round (useState initializer already did it above).
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setTokens(createRound(selectedGroupIds));
    resetEngineRef.current();
  }, [selectedGroupIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetRound = () => {
    setTokens(createRound(selectedGroupIds));
    resetEngine();
  };

  // Focus the input zone on any character key press so the overlay dismisses
  // even when the div is not already the active element.
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
        <title>Wakana Type | Practice Kana</title>
        <meta
          name="description"
          content="Practice Japanese hiragana typing with real-time accuracy metrics."
        />
        <link rel="canonical" href={`${SITE_URL}/practice`} />
      </Helmet>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Practice Mode</h1>
              <p className="mt-1 text-sm text-ink-500">
                Type romaji and match kana in real time. Press Esc to restart.
              </p>
            </div>
            <button
              type="button"
              onClick={resetRound}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              New Round
            </button>
          </header>

          <CharacterFilter
            groups={GROUPS}
            selectedGroupIds={selectedGroupIds}
            targetKanaLength={targetKanaLength}
            onToggleGroup={toggleGroup}
            onToggleAllGroups={toggleAllGroups}
            onToggleGroupFamily={toggleGroupFamily}
          />

          <div className="relative">
            <TypingCanvas
              tokens={tokens}
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
                onRetry={resetRound}
                isFinished={isFinished}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
