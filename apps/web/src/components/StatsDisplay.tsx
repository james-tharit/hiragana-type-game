type StatsDisplayProps = {
  progress: number;
  total: number;
  accuracy: number;
  mistakeKeystrokes: number;
  totalKeystrokes: number;
  onRetry: () => void;
  isFinished?: boolean;
};

const confettiPalette = ['#22c55e', '#16a34a', '#4ade80', '#facc15', '#f97316', '#60a5fa'];

function getAccuracyColorClass(accuracy: number, isFinished?: boolean) {
  if (!isFinished) {
    return 'text-ink-100';
  }

  if (accuracy < 15) {
    return 'text-red-400';
  }

  if (accuracy < 30) {
    return 'text-orange-400';
  }

  if (accuracy > 80) {
    return 'text-green-400';
  }

  return 'text-ink-100';
}

function StatsDisplay({
  progress,
  total,
  accuracy,
  mistakeKeystrokes,
  totalKeystrokes,
  onRetry,
  isFinished,
}: StatsDisplayProps) {
  const showConfetti = Boolean(isFinished && accuracy > 80);
  const accuracyColorClass = getAccuracyColorClass(accuracy, isFinished);

  return (
    <>
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => {
            const left = (index * 17) % 100;
            const delay = (index % 8) * 0.18;
            const duration = 2.2 + (index % 5) * 0.22;
            const rotate = (index % 2 === 0 ? 1 : -1) * (18 + (index % 7) * 6);
            const color = confettiPalette[index % confettiPalette.length];

            return (
              <span
                key={index}
                className="absolute top-[-10%] h-3 w-2 rounded-sm opacity-90 animate-confetti-fall"
                style={{
                  left: `${left}%`,
                  backgroundColor: color,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  transform: `rotate(${rotate}deg)`,
                }}
              />
            );
          })}
        </div>
      )}
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
          <p className={`mt-1 text-lg font-semibold ${accuracyColorClass}`}>{accuracy.toFixed(1)}%</p>
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

      <style>
        {`\
          @keyframes confetti-fall {
            0% {
              transform: translate3d(0, -10vh, 0) rotate(0deg);
              opacity: 0;
            }
            12% {
              opacity: 1;
            }
            100% {
              transform: translate3d(0, 110vh, 0) rotate(680deg);
              opacity: 0;
            }
          }

          .animate-confetti-fall {
            animation-name: confetti-fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        `}
      </style>
    </>
  );
}

export default StatsDisplay;