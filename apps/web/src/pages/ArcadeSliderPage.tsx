import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createRound, useFilterContext } from '@wakana/core';
import KanaSlider from '../components/KanaSlider';
import { useTypingEngine } from '../hooks/useTypingEngine';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

export function ArcadeSliderPage() {
  const { selectedGroupIds, script } = useFilterContext();
  const [tokens, setTokens] = useState(() => createRound(selectedGroupIds));
  const { index, currentWrong } = useTypingEngine(tokens, () => setTokens(createRound(selectedGroupIds)));

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

          <div className="mt-6 overflow-hidden rounded-2xl border border-moss/20 bg-cream">
            <KanaSlider tokens={tokens} script={script} index={index} currentWrong={currentWrong} />
          </div>
        </section>
      </main>
    </>
  );
}
