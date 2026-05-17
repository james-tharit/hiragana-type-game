import { Helmet } from 'react-helmet-async';
import { Link, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { CommonNav } from '../components/CommonNav';
import { GROUPS } from '../constants/kanaGroups';
import { FilterProvider } from '../contexts/FilterContext';
import { ArcadePage } from '../pages/ArcadePage';
import { KanaIndexPage } from '../pages/KanaIndexPage';
import { PracticePage } from '../pages/PracticePage';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.wakana.sbs';

/**
 * Root layout: wraps every page in the shared FilterProvider so both
 * PracticePage and ArcadePage read from the same kana-group selection,
 * then renders CommonNav above the page outlet.
 */
function RootLayout() {
  return (
    <FilterProvider>
      <CommonNav />
      <Outlet />
    </FilterProvider>
  );
}

function AboutPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
      <Helmet>
        <title>About Wakana Type — Hiragana Typing Trainer</title>
        <meta
          name="description"
          content="Learn how Wakana Type helps improve Japanese hiragana input accuracy by tracking mistakes and building consistent romaji-to-kana habits."
        />
        <link rel="canonical" href={`${SITE_URL}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/about`} />
        <meta property="og:title" content="About Wakana Type — Hiragana Typing Trainer" />
        <meta property="og:description" content="Wakana Type tracks your mistakes per character so you drill only what you miss. Free, browser-based, no sign-up." />
        <meta property="og:image" content={`${SITE_URL}/og-practice.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">About</h1>
        <p className="mt-4 text-ink-500">
          Wakana Type is a focused hiragana trainer built around accuracy first. Instead of pushing speed,
          each round helps you reduce errors and build consistent romaji to kana input habits.
        </p>
        <p className="mt-3 text-ink-500">
          You can practice by kana families, monitor your accuracy in real time, and see exactly how many
          mistakes were made in a round.
        </p>
        <p className="mt-6">
          <Link className="text-cyan-300 hover:text-cyan-200" to="/practice">
            Back to practice
          </Link>
        </p>
      </section>
    </main>
  );
}

function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const group = GROUPS.find((entry) => entry.id === id);

  if (!group || !id) {
    return <Navigate to="/practice" replace />;
  }

  const romajiList = group.entries.map((e) => e.romaji).join(', ');
  const kanaList   = group.entries.map((e) => e.kana).join(' ');

  return (
    <>
      <Helmet>
        <title>{`${group.label} Hiragana Practice (${romajiList}) — Wakana Type`}</title>
        <meta
          name="description"
          content={`Type ${romajiList} to match ${kanaList}. Drill the ${group.label} hiragana row with instant accuracy feedback — free browser practice, no install.`}
        />
        <link rel="canonical" href={`${SITE_URL}/group/${id}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/group/${id}`} />
        <meta property="og:title" content={`${group.label} Hiragana Practice — Wakana Type`} />
        <meta property="og:description" content={`Type ${romajiList} to match ${kanaList}. Drill the ${group.label} row with instant accuracy feedback.`} />
        <meta property="og:image" content={`${SITE_URL}/og-practice.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <PracticePage />
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/practice" replace />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/arcade" element={<ArcadePage />} />
        <Route path="/kana" element={<KanaIndexPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/group/:id" element={<GroupPage />} />
        <Route path="*" element={<Navigate to="/practice" replace />} />
      </Route>
    </Routes>
  );
}
