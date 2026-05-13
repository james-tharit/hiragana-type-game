import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import CharacterFilter from './components/CharacterFilter';
import StatsDisplay from './components/StatsDisplay';
import TypingCanvas from './components/TypingCanvas';
import { createRound, DEFAULT_GROUPS, GROUPS } from './constants/kanaGroups';
import { useTypingEngine } from './hooks/useTypingEngine';

function App() {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(DEFAULT_GROUPS);
  const [tokens, setTokens] = useState(() => createRound(DEFAULT_GROUPS));
  const allGroupIds = useMemo(() => GROUPS.map((group) => group.id), []);
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
    handleKeyDown,
  } = useTypingEngine(tokens);

  const targetKanaLength = useMemo(
    () => tokens.reduce((sum, token) => sum + token.kana.length, 0),
    [tokens],
  );

  const resetRound = (groupIds: string[] = selectedGroupIds) => {
    setTokens(createRound(groupIds));
    resetEngine();
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId];
      resetRound(next);
      return next;
    });
  };

  const toggleAllGroups = () => {
    setSelectedGroupIds((prev) => {
      const next = prev.length === allGroupIds.length ? [] : allGroupIds;
      resetRound(next);
      return next;
    });
  };

  const toggleGroupFamily = (familyGroupIds: string[]) => {
    setSelectedGroupIds((prev) => {
      const familyFullySelected = familyGroupIds.every((id) => prev.includes(id));
      const next = familyFullySelected
        ? prev.filter((id) => !familyGroupIds.includes(id))
        : Array.from(new Set([...prev, ...familyGroupIds]));

      resetRound(next);
      return next;
    });
  };

  const onCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const result = handleKeyDown(event);

    if (result === 'reset-round') {
      resetRound();
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-10 pt-8 text-ink-100 sm:px-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wakana Type</h1>
            <p className="mt-1 text-sm text-ink-500">
              Type romaji and match kana in real time. Press Esc to restart.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/about"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              About
            </Link>
            <button
              type="button"
              onClick={() => resetRound()}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              New Round
            </button>
          </div>
        </header>

        <CharacterFilter
          groups={GROUPS}
          selectedGroupIds={selectedGroupIds}
          targetKanaLength={targetKanaLength}
          onToggleGroup={toggleGroup}
          onToggleAllGroups={toggleAllGroups}
          onToggleGroupFamily={toggleGroupFamily}
        />

        <StatsDisplay
          progress={index}
          total={tokens.length}
          accuracy={accuracy}
          mistakeKeystrokes={mistakeKeystrokes}
          totalKeystrokes={totalKeystrokes}
          isFinished={isFinished}
          onRetry={() => resetRound()}
        />

        <TypingCanvas
          tokens={tokens}
          index={index}
          buffer={buffer}
          composedKana={composedKana}
          currentWrong={currentWrong}
          isFinished={isFinished}
          accuracy={accuracy}
          onKeyDown={onCanvasKeyDown}
        />
      </section>
    </main>
  );
}

export default App;