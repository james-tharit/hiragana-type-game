import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { GROUPS } from '../constants/kanaGroups';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

const FAMILIES = ['Monographs', 'Diacritics', 'Digraphs'] as const;

export function KanaIndexPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
      <Helmet>
        <title>Hiragana Chart with Romaji — All 46 Characters | Wakana Type</title>
        <meta
          name="description"
          content="Complete hiragana chart showing all 46 characters with romaji pronunciation. Browse every kana row and open an interactive typing drill for any group."
        />
        <link rel="canonical" href={`${SITE_URL}/kana`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/kana`} />
        <meta property="og:title" content="Hiragana Chart with Romaji — All 46 Characters | Wakana Type" />
        <meta
          property="og:description"
          content="Browse all 46 hiragana with romaji. Click any row to open a live typing drill."
        />
        <meta property="og:image" content={`${SITE_URL}/og-practice.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Table',
            name: 'Hiragana Chart with Romaji',
            description: 'All 46 hiragana characters organised by row, with romaji equivalents and links to interactive typing drills.',
            url: `${SITE_URL}/kana`,
          })}
        </script>
      </Helmet>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hiragana Chart</h1>
        <p className="mt-2 text-sm text-ink-500">
          All standard hiragana with romaji. Click any row to open a focused typing drill.
        </p>

        {FAMILIES.map((family) => {
          const familyGroups = GROUPS.filter((g) => g.family === family);
          return (
            <section key={family} className="mt-8">
              <h2 className="mb-3 text-base font-semibold uppercase tracking-widest text-ink-500">
                {family}
              </h2>
              <div className="flex flex-col gap-2">
                {familyGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/group/${group.id}`}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <span className="w-24 shrink-0 font-mono text-xs text-ink-500">
                      {group.label}
                    </span>
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      {group.entries.map((e) => (
                        <span key={e.kana} className="flex flex-col items-center leading-tight">
                          <span className="text-xl">{e.kana}</span>
                          <span className="text-[10px] text-ink-500">{e.romaji}</span>
                        </span>
                      ))}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
