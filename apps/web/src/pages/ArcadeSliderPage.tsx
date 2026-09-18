import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CharacterFilter, GROUPS, createRound, useFilterContext } from '@wakana/core';
import KanaSlider from '../components/KanaSlider';
import { useTypingEngine } from '../hooks/useTypingEngine';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';
const REFILL_THRESHOLD = 10;

export function ArcadeSliderPage() {
  const { selectedGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily, script, setScript } =
    useFilterContext();
  const [tokens, setTokens] = useState(() => createRound(selectedGroupIds));
  const { index, currentWrong, accuracy, resetEngine } = useTypingEngine(tokens, () =>
    setTokens(createRound(selectedGroupIds)),
  );

  const targetKanaLength = useMemo(
    () =>
      GROUPS.filter((g) => selectedGroupIds.includes(g.id)).reduce(
        (sum, g) => sum + g.entries.length,
        0,
      ),
    [selectedGroupIds],
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

  // ponytail: stream only ever grows (never trims the consumed head), so it's
  // O(session length) in memory/render for a long endless run. Rebase index
  // and slice off the head if that ever matters — pairs with the
  // non-virtualised track in KanaSlider.tsx.
  useEffect(() => {
    if (index < tokens.length - REFILL_THRESHOLD) return;
    setTokens((prev) => [...prev, ...createRound(selectedGroupIds)]);
  }, [index, tokens.length, selectedGroupIds]);

  return (
    <>
      <Helmet>
        <title>Kana Slider — Wakana Type</title>
        <meta
          name="description"
          content="Kana scroll past — type the one in the middle. A fast-paced hiragana and katakana typing drill, free in your browser."
        />
        <link rel="canonical" href={`${SITE_URL}/arcade/slider`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/arcade/slider`} />
        <meta property="og:title" content="Kana Slider — Wakana Type" />
        <meta property="og:description" content="Kana scroll past — type the one in the middle. Free, no sign-up." />
        <meta property="og:image" content={`${SITE_URL}/og-arcade.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kana Slider — Wakana Type" />
        <meta name="twitter:description" content="Kana scroll past — type the one in the middle." />
        <meta name="twitter:image" content={`${SITE_URL}/og-arcade.png`} />
      </Helmet>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-bark sm:px-8">
        <section className="rounded-3xl border border-moss/20 bg-sand/60 p-6 shadow-[0_18px_50px_rgba(42,124,19,0.13)] backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Kana Slider</h1>
          <p className="mt-1 text-sm text-sage">Kana scroll past — type the one in the middle.</p>

          <CharacterFilter
            groups={GROUPS}
            selectedGroupIds={selectedGroupIds}
            targetKanaLength={targetKanaLength}
            onToggleGroup={toggleGroup}
            onToggleAllGroups={toggleAllGroups}
            onToggleGroupFamily={toggleGroupFamily}
            script={script}
            onScriptChange={setScript}
          />

          <div className="mt-6 overflow-hidden rounded-2xl border border-moss/20 bg-cream">
            <KanaSlider tokens={tokens} script={script} index={index} currentWrong={currentWrong} />
          </div>

          <dl className="mt-4 flex items-center justify-center gap-8 text-sm text-sage">
            <div className="text-center">
              <dt className="text-xs uppercase tracking-wide">Cleared</dt>
              <dd data-testid="slider-cleared" className="text-lg font-semibold text-bark">{index}</dd>
            </div>
            <div className="text-center">
              <dt className="text-xs uppercase tracking-wide">Accuracy</dt>
              <dd data-testid="slider-accuracy" className="text-lg font-semibold text-bark">{Math.round(accuracy)}%</dd>
            </div>
          </dl>
          <p className="mt-2 text-center text-xs text-sage">Press Space to restart the stream.</p>
        </section>
      </main>
    </>
  );
}
