type StatsDisplayProps = {
  progress: number;
  total: number;
  accuracy: number;
  mistakeKeystrokes: number;
  totalKeystrokes: number;
  onRetry: () => void;
  isFinished?: boolean;
};

function StatsDisplay({
  progress,
  total,
  accuracy,
  mistakeKeystrokes,
  totalKeystrokes,
  onRetry,
  isFinished,
}: StatsDisplayProps) {
  return (
    <>
      <section
        className={`mb-6 grid gap-3 text-sm sm:grid-cols-4 transition-all duration-500 ${isFinished ? 'scale-105 opacity-100' : 'scale-95 opacity-0'}`}
      >
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
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-2 text-base font-medium text-white transition hover:bg-white/20 shadow-lg"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}

export default StatsDisplay;