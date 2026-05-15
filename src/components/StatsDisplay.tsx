type StatsDisplayProps = {
  progress: number;
  total: number;
  accuracy: number;
  mistakeKeystrokes: number;
  totalKeystrokes: number;
  onRetry: () => void;
};

function StatsDisplay({
  progress,
  total,
  accuracy,
  mistakeKeystrokes,
  totalKeystrokes,
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
    </>
  );
}

export default StatsDisplay;