import { Helmet } from 'react-helmet-async';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import App from '../App';
import { GROUPS } from '../constants/kanaGroups';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://example.com';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>Wakana Type | Practice Kana</title>
        <meta
          name="description"
          content="Practice Japanese hiragana typing with real-time WPM and accuracy metrics."
        />
        <link rel="canonical" href={`${SITE_URL}/`} />
      </Helmet>
      <App />
    </>
  );
}

function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
      <Helmet>
        <title>About Wakana Type</title>
        <meta
          name="description"
          content="Learn how Wakana Type helps improve Japanese input speed and accuracy."
        />
        <link rel="canonical" href={`${SITE_URL}/about`} />
      </Helmet>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">About</h1>
        <p className="mt-4 text-ink-500">
          This game is built to train hiragana typing speed and consistency using focused kana groups,
          timing feedback, and round-based drills.
        </p>
        <p className="mt-6">
          <Link className="text-cyan-300 hover:text-cyan-200" to="/">
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
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{`${group.label} | Wakana Type`}</title>
        <meta
          name="description"
          content={`Practice the ${group.label} kana set with focused typing drills and live performance stats.`}
        />
        <link rel="canonical" href={`${SITE_URL}/group/${id}`} />
      </Helmet>
      <App />
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/group/:id" element={<GroupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
