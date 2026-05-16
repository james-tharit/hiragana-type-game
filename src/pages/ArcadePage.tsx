import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import CharacterFilter from '../components/CharacterFilter';
import { GROUPS } from '../constants/kanaGroups';
import { useFilterContext } from '../contexts/FilterContext';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

export function ArcadePage() {
  const { selectedGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily } = useFilterContext();

  // Count individual kana entries across selected groups for the filter summary.
  const targetKanaLength = useMemo(
    () =>
      GROUPS.filter((g) => selectedGroupIds.includes(g.id)).reduce(
        (sum, g) => sum + g.entries.length,
        0,
      ),
    [selectedGroupIds],
  );

  return (
    <>
      <Helmet>
        <title>Wakana Type | Arcade Mode</title>
        <meta
          name="description"
          content="Challenge yourself with Arcade Mode — type kana to keep the bird airborne."
        />
        <link rel="canonical" href={`${SITE_URL}/arcade`} />
      </Helmet>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Arcade Mode</h1>
            <p className="mt-1 text-sm text-ink-500">
              Type the kana to keep the bird airborne. Filters sync with Practice Mode.
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

          {/* TypingArcadeCanvas will be mounted here once the Flappy Bird engine
              is implemented. It will receive selectedGroupIds from the context. */}
          <div className="flex min-h-[17rem] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-8">
            <p className="text-center text-sm text-ink-500">
              Arcade canvas coming soon
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
