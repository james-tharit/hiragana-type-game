import { displayFor } from '@wakana/core';
import type { Entry, Script } from '@wakana/core';

type KanaSliderProps = {
  tokens: Entry[];
  script: Script;
  index: number;
  currentWrong?: boolean;
};

const SLOT_PX = 96;

// The strut of the page font (Space Grotesk) decides where a glyph's baseline
// sits, and it carries no kana — every kana here is a fallback glyph, so its
// ink lands wherever the two fonts' metrics happen to disagree. Naming the CJK
// stack makes the strut and the glyph come from the same font.
const KANA_FONT = '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';

function KanaSlider({ tokens, script, index, currentWrong }: KanaSliderProps) {
  return (
    <div className="relative h-32 overflow-hidden">
      <div
        aria-hidden="true"
        style={{ width: SLOT_PX, height: SLOT_PX }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-moss/40"
      />
      {/* ponytail: renders the whole token list rather than virtualising; virtualise if a session ever runs to thousands of kana */}
      <div
        data-testid="kana-slider-track"
        className="absolute left-1/2 top-0 flex h-full items-center transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${index * SLOT_PX + SLOT_PX / 2}px)`, fontFamily: KANA_FONT }}
      >
        {tokens.map((token, i) => (
          <span
            key={i}
            aria-current={i === index ? 'true' : undefined}
            aria-invalid={i === index && currentWrong ? 'true' : undefined}
            // Sized in px from the same constant the transform shifts by: as
            // rem (w-24) the two disagree whenever the browser's default font
            // size is not 16px, and the focused kana drifts out of the frame.
            style={{ width: SLOT_PX, height: SLOT_PX }}
            className={`flex flex-none items-center justify-center text-5xl leading-none transition-colors ${
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
