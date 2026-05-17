import { useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import CharacterFilter from '../components/CharacterFilter';
import { GROUPS } from '../constants/kanaGroups';
import { useFilterContext } from '../contexts/FilterContext';
import { DinoGameCanvas, type DinoGameCanvasHandle } from '../components/DinoGameCanvas';
import type { WordEntry } from '../game/engine';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

export function ArcadePage() {
  const { selectedGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily } = useFilterContext();
  const gameRef = useRef<DinoGameCanvasHandle>(null);

  // Count individual kana entries across selected groups for the filter summary.
  const targetKanaLength = useMemo(
    () =>
      GROUPS.filter((g) => selectedGroupIds.includes(g.id)).reduce(
        (sum, g) => sum + g.entries.length,
        0,
      ),
    [selectedGroupIds],
  );

  // Flat pool of kana entries for the currently selected groups.
  const pool = useMemo<WordEntry[]>(
    () => GROUPS.filter((g) => selectedGroupIds.includes(g.id)).flatMap((g) => g.entries),
    [selectedGroupIds],
  );

  // Romaji typing buffer — accumulates keystrokes and fires into the game
  // engine whenever a complete syllable is matched against the active pool.
  useEffect(() => {
    const romajiSet = new Set(pool.map((e) => e.romaji));
    let buffer = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[a-zA-Z']$/.test(e.key)) return;

      buffer += e.key.toLowerCase();

      // Exact match — dispatch to game engine and reset.
      if (romajiSet.has(buffer)) {
        gameRef.current?.resolveTypedWord(buffer);
        buffer = '';
        return;
      }

      // Dead-end prefix — retry starting from this keystroke.
      if (!pool.some((entry) => entry.romaji.startsWith(buffer))) {
        buffer = e.key.toLowerCase();
        if (!pool.some((entry) => entry.romaji.startsWith(buffer))) {
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pool]);

  return (
    <>
      <Helmet>
        <title>Hiragana Arcade Games — Wakana Type</title>
        <meta
          name="description"
          content="Control browser mini-games by typing hiragana. Type the correct romaji to keep the T-Rex running. Learn Japanese while you play — free, no install."
        />
        <link rel="canonical" href={`${SITE_URL}/arcade`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/arcade`} />
        <meta property="og:title" content="Hiragana Arcade Games — Wakana Type" />
        <meta property="og:description" content="Control browser mini-games by typing hiragana. Type romaji to keep the T-Rex running. Free, no install." />
        <meta property="og:image" content={`${SITE_URL}/og-arcade.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hiragana Arcade Games — Wakana Type" />
        <meta name="twitter:description" content="Control browser mini-games by typing hiragana. Type romaji to keep the T-Rex running." />
        <meta name="twitter:image" content={`${SITE_URL}/og-arcade.png`} />
      </Helmet>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Arcade Mode</h1>
            <p className="mt-1 text-sm text-ink-500">
              Type the kana to keep the T-Rex airborne. Filters sync with Practice Mode.
            </p>
          </header>

          {/* Shared filter — reads from and writes to FilterContext, so changes
              are reflected immediately when switching back to Practice Mode.   */}
          <CharacterFilter
            groups={GROUPS}
            selectedGroupIds={selectedGroupIds}
            targetKanaLength={targetKanaLength}
            onToggleGroup={toggleGroup}
            onToggleAllGroups={toggleAllGroups}
            onToggleGroupFamily={toggleGroupFamily}
          />

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <DinoGameCanvas
              ref={gameRef}
              pool={pool}
            />
          </div>
        </section>
      </main>
    </>
  );
}
