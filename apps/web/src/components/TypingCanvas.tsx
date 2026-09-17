import {
  memo,
  useEffect,
  useMemo,
} from 'react';
import { displayFor } from '@wakana/core';
import type { Entry, Script } from '@wakana/core';
import type { RubySegment } from '../data/furigana';

type TypingCanvasProps = {
  tokens: Entry[];
  segments?: RubySegment[];
  script: Script;
  index: number;
  buffer: string;
  composedKana: string;
  currentWrong: boolean;
  isFinished: boolean;
  accuracy: number;
  targetRevealed: boolean;
  revealTarget: () => void;
  inputZoneRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
};

type KanaTokenProps = {
  display: string;
  status: 'pending' | 'done' | 'active' | 'error';
};

const KanaToken = memo(
  ({ display, status }: KanaTokenProps) => {
    const colorClass =
      status === 'done'
        ? 'text-bark'
        : status === 'error'
          ? 'text-red-700'
          : status === 'active'
            ? 'text-moss'
            : 'text-sage';

    return (
      <span className={`${colorClass} transition-colors duration-150`}>
        {display}
      </span>
    );
  },
  (prev, next) => prev.display === next.display && prev.status === next.status,
);

function statusFor(mora: number | null, index: number, currentWrong: boolean): KanaTokenProps['status'] {
  if (mora === null) return 'pending';
  if (mora < index) return 'done';
  if (mora === index) return currentWrong ? 'error' : 'active';
  return 'pending';
}

function TypingCanvas({
  tokens,
  segments,
  script,
  index,
  buffer,
  composedKana,
  currentWrong,
  isFinished,
  accuracy,
  targetRevealed,
  revealTarget,
  inputZoneRef,
  isFocused,
  setIsFocused,
}: TypingCanvasProps) {
  const composedDisplay = displayFor(composedKana, script);
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
        className="relative mb-6 min-h-[17rem] rounded-2xl border border-moss/20 bg-cream p-8 outline-none transition focus:border-moss/50 sm:p-10"
      >
        <div className={`transition duration-150 ${isFocused ? 'opacity-100 blur-0' : 'opacity-70 blur-[1.2px]'}`}>
          <div className="relative flex flex-wrap gap-x-2 gap-y-3 text-4xl leading-tight sm:text-5xl">
            {segments
              ? segments.map((segment, segmentIndex) => {
                  const charTokens = segment.chars.map((c, charIndex) => (
                    <KanaToken
                      key={charIndex}
                      display={c.char}
                      status={statusFor(c.mora, index, currentWrong)}
                    />
                  ));

                  if (!segment.reading) {
                    return <span key={segmentIndex}>{charTokens}</span>;
                  }

                  return (
                    // ponytail: base kanji stays text-bark (uncoloured) — the
                    // reading above it carries progress instead. Upgrade:
                    // colour the base by its mora range if that's ever needed.
                    <ruby key={segmentIndex} className="text-bark">
                      {segment.text}
                      <rt>{charTokens}</rt>
                    </ruby>
                  );
                })
              : tokens.map((token, tokenIndex) => {
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
                      display={displayFor(token.kana, script)}
                      status={status}
                    />
                  );
                })}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 text-base text-sage">
            <p>
              Romaji: <span className={currentWrong ? 'text-red-700' : 'text-bark'}>{buffer || '...'}</span>
            </p>
            <p>
              Kana: <span className={currentWrong ? 'text-red-700' : 'text-bark'}>{composedDisplay || '...'}</span>
            </p>
            {targetRevealed ? (
              <p>
                Target:{' '}
                <span className="text-bark">{typedGhost}</span>
                <span className="decoration-sage underline underline-offset-4">{pendingGhost || '...'}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={revealTarget}
                className="animate-pulse rounded px-2 py-0.5 text-xs font-medium text-moss ring-1 ring-moss/50 transition hover:text-bark hover:ring-moss/70"
              >
                Reveal target <span className="opacity-60">[Spacebar]</span>
              </button>
            )}
            <p>
              Accuracy: <span className="text-bark">{accuracy.toFixed(1)}%</span>
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
          className="absolute inset-0 z-20 rounded-2xl bg-sand/80 text-sm font-semibold uppercase tracking-[0.14em] text-bark"
        >
          Click or Press Any Key To Focus
        </button>)}
    </div>
  );
}

export default TypingCanvas;