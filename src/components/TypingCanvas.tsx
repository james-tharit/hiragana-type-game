import {
  memo,
  useEffect,
  useMemo,
} from 'react';
import type { Entry } from '../constants/kanaGroups';

type TypingCanvasProps = {
  tokens: Entry[];
  index: number;
  buffer: string;
  composedKana: string;
  currentWrong: boolean;
  isFinished: boolean;
  accuracy: number;
  hasFailedOnce: boolean;
  targetRevealed: boolean;
  revealTarget: () => void;
  inputZoneRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
};

type KanaTokenProps = {
  kana: string;
  status: 'pending' | 'done' | 'active' | 'error';
};

const KanaToken = memo(
  ({ kana, status }: KanaTokenProps) => {
    const colorClass =
      status === 'done'
        ? 'text-ink-100'
        : status === 'error'
          ? 'text-red-500'
          : status === 'active'
            ? 'text-orange-400'
            : 'text-ink-500';

    return (
      <span className={`${colorClass} transition-colors duration-150`}>
        {kana}
      </span>
    );
  },
  (prev, next) => prev.kana === next.kana && prev.status === next.status,
);

function TypingCanvas({
  tokens,
  index,
  buffer,
  composedKana,
  currentWrong,
  isFinished,
  accuracy,
  hasFailedOnce,
  targetRevealed,
  revealTarget,
  inputZoneRef,
  isFocused,
  setIsFocused,
}: TypingCanvasProps) {
  const activeRomaji = useMemo(() => {
    if (isFinished || !tokens[index]) {
      return '';
    }

    return tokens[index].romaji;
  }, [tokens, index, isFinished]);

  const typedGhost = activeRomaji.slice(0, Math.min(buffer.length, activeRomaji.length));
  const pendingGhost = activeRomaji.slice(Math.min(buffer.length, activeRomaji.length));

  // Auto-focus the input zone on mount so the window listener immediately
  // registers visible focus state.
  useEffect(() => {
    inputZoneRef?.current?.focus();
  }, [inputZoneRef]);

  return (
    <div className="relative">
      <div
        ref={inputZoneRef}
        tabIndex={0}
        data-testid="input-zone"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="relative mb-6 min-h-[17rem] rounded-2xl border border-white/10 bg-black/30 p-8 outline-none transition focus:border-white/30 sm:p-10"
      >
        <div className={`transition duration-150 ${isFocused ? 'opacity-100 blur-0' : 'opacity-70 blur-[1.2px]'}`}>
          <div className="relative flex flex-wrap gap-x-2 gap-y-3 text-4xl leading-tight sm:text-5xl">
            {tokens.map((token, tokenIndex) => {
              let status: KanaTokenProps['status'] = 'pending';

              if (tokenIndex < index) {
                status = 'done';
              } else if (tokenIndex === index && currentWrong) {
                status = 'error';
              } else if (tokenIndex === index) {
                status = 'active';
              }

              return (
                <KanaToken
                  key={`${token.kana}-${tokenIndex}`}
                  kana={token.kana}
                  status={status}
                />
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 text-base text-ink-500">
            <p>
              Romaji: <span className={currentWrong ? 'text-red-400' : 'text-ink-100'}>{buffer || '...'}</span>
            </p>
            <p>
              Kana: <span className={currentWrong ? 'text-red-400' : 'text-ink-100'}>{composedKana || '...'}</span>
            </p>
            {targetRevealed ? (
              <p>
                Target:{' '}
                <span className="text-ink-100">{typedGhost}</span>
                <span className="decoration-ink-700 underline underline-offset-4">{pendingGhost || '...'}</span>
              </p>
            ) : hasFailedOnce ? (
              <button
                type="button"
                onClick={revealTarget}
                className="animate-pulse rounded px-2 py-0.5 text-xs font-medium text-orange-400 ring-1 ring-orange-400/50 transition hover:text-orange-300 hover:ring-orange-300/70"
              >
                Reveal target <span className="opacity-60">[Spacebar]</span>
              </button>
            ) : null}
            <p>
              Accuracy: <span className="text-ink-100">{accuracy.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      </div>

      {!isFocused && !isFinished && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => inputZoneRef?.current?.focus()}
          tabIndex={0}
          className="absolute inset-0 z-20 rounded-2xl bg-black/50 text-sm font-semibold uppercase tracking-[0.14em] text-ink-100"
        >
          Click or Press Any Key To Focus
        </button>)}
    </div>
  );
}

export default TypingCanvas;