import { displayFor } from '@wakana/core';
import type { Entry, Script } from '@wakana/core';

type KanaSliderProps = {
  tokens: Entry[];
  script: Script;
  index: number;
  currentWrong?: boolean;
};

const SLOT_PX = 96;

function KanaSlider({ tokens, script, index, currentWrong }: KanaSliderProps) {
  return (
    <div className="relative h-32 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-moss/40"
      />
      {/* ponytail: renders the whole token list rather than virtualising; virtualise if a session ever runs to thousands of kana */}
      <div
        data-testid="kana-slider-track"
        className="absolute left-1/2 top-0 flex h-full items-center transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${index * SLOT_PX + SLOT_PX / 2}px)` }}
      >
        {tokens.map((token, i) => (
          <span
            key={i}
            aria-current={i === index ? 'true' : undefined}
            aria-invalid={i === index && currentWrong ? 'true' : undefined}
            className={`w-24 flex-none text-center text-5xl transition-colors ${
              i === index ? (currentWrong ? 'text-red-700' : 'text-moss') : 'text-sage/50'
            }`}
          >
            {displayFor(token.kana, script)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default KanaSlider;
