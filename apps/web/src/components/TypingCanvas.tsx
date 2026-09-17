import {
  memo,
  useEffect,
} from 'react';
import { displayFor } from '@wakana/core';
import type { Entry, Script } from '@wakana/core';
import type { RubyChar, RubySegment } from '../data/furigana';

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
  toplineVisible: boolean;
  toggleTopline: () => void;
  onRestart: () => void;
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

// Collapses a segment's per-char moras into one status for its base, used
// when the topline is hidden and the reading (where per-mora colour usually
// lives) isn't rendered. A segment made only of null-mora chars (punctuation)
// never types, so it never leaves 'pending'.
function segmentStatusFor(chars: RubyChar[], index: number, currentWrong: boolean): KanaTokenProps['status'] {
  const moras = chars.map((c) => c.mora).filter((m): m is number => m !== null);
  if (moras.length === 0) return 'pending';
  if (moras.includes(index)) return currentWrong ? 'error' : 'active';
  if (moras.every((m) => m < index)) return 'done';
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
  toplineVisible,
  toggleTopline,
  onRestart,
  inputZoneRef,
  isFocused,
  setIsFocused,
}: TypingCanvasProps) {
  const composedDisplay = displayFor(composedKana, script);

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
          {/* rt is pinned to 0.5em/1.2 so the annotation band is exactly 0.6em
              tall; the hidden state pads that same 0.6em back so toggling the
              topline never shifts the prompt. */}
          <div
            className={`relative flex flex-wrap gap-x-2 gap-y-3 text-4xl leading-tight sm:text-5xl [&_rt]:text-[0.5em] [&_rt]:leading-[1.2] ${
              toplineVisible ? '' : 'pt-[0.6em]'
            }`}
          >
            {segments
              ? segments.map((segment, segmentIndex) => {
                  if (!toplineVisible) {
                    // Hidden reading: colour the base per segment since
                    // per-mora colour has nowhere to live without the <rt>.
                    return (
                      <KanaToken
                        key={segmentIndex}
                        display={segment.text}
                        status={segmentStatusFor(segment.chars, index, currentWrong)}
                      />
                    );
                  }

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

                  const display = displayFor(token.kana, script);
                  const kanaToken = (
                    <KanaToken
                      key={toplineVisible ? undefined : `${token.kana}-${tokenIndex}`}
                      display={display}
                      status={status}
                    />
                  );

                  if (!toplineVisible) {
                    return kanaToken;
                  }

                  return (
                    <ruby key={`${token.kana}-${tokenIndex}`}>
                      {kanaToken}
                      <rt>{token.romaji}</rt>
                    </ruby>
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
            <p>
              Accuracy: <span className="text-bark">{accuracy.toFixed(1)}%</span>
            </p>
            <button
              type="button"
              onClick={onRestart}
              className="rounded px-2 py-0.5 text-xs font-medium text-moss ring-1 ring-moss/50 transition hover:text-bark hover:ring-moss/70"
            >
              Restart <span className="opacity-60">[Space]</span>
            </button>
            <button
              type="button"
              onClick={toggleTopline}
              className="rounded px-2 py-0.5 text-xs font-medium text-moss ring-1 ring-moss/50 transition hover:text-bark hover:ring-moss/70"
            >
              {toplineVisible ? 'Hide reading' : 'Show reading'} <span className="opacity-60">[Tab]</span>
            </button>
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