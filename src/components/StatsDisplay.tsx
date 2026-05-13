type StatsDisplayProps = {
  progress: number;
  total: number;
  accuracy: number;
  mistakeKeystrokes: number;
  totalKeystrokes: number;
  isFinished: boolean;
  onRetry: () => void;
};

function StatsDisplay({
  progress,
  total,
  accuracy,
  mistakeKeystrokes,
  totalKeystrokes,
  isFinished,
  onRetry,
}: StatsDisplayProps) {
  return (
    <>
      <section className="mb-6 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500">Progress</p>
          <p className="mt-1 text-lg font-semibold text-ink-100">
            {progress}/{total}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500">Accuracy</p>
          <p className="mt-1 text-lg font-semibold text-ink-100">{accuracy.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500">Mistakes</p>
          <p className="mt-1 text-lg font-semibold text-ink-100">{mistakeKeystrokes}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500">Keystrokes</p>
          <p className="mt-1 text-lg font-semibold text-ink-100">{totalKeystrokes}</p>
        </div>
      </section>

      {isFinished && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-lg font-semibold">Result</h2>
          <div className="mt-3 grid gap-2 text-sm text-ink-500 sm:grid-cols-3">
            <p>
              Accuracy: <span className="text-xl font-bold text-ink-100">{accuracy.toFixed(1)}%</span>
            </p>
            <p>
              Mistakes: <span className="text-xl font-bold text-ink-100">{mistakeKeystrokes}</span>
            </p>
            <p>
              Keystrokes: <span className="text-xl font-bold text-ink-100">{totalKeystrokes}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Try Again
          </button>
        </section>
      )}
    </>
  );
}

export default StatsDisplay;