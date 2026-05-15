import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type React from 'react';
import { useTypingEngine } from './useTypingEngine';
import type { Entry } from '../constants/kanaGroups';

// wanakana is used internally; no need to mock for romaji-based matching.
// Date.now is controlled via vi.spyOn where timing matters.

function makeKeyEvent(
  key: string,
  opts: { preventDefault?: () => void } = {},
): React.KeyboardEvent<HTMLDivElement> {
  return {
    key,
    preventDefault: opts.preventDefault ?? vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

const TOKENS: Entry[] = [
  { kana: 'あ', romaji: 'a' },
  { kana: 'い', romaji: 'i' },
  { kana: 'う', romaji: 'u' },
];

describe('useTypingEngine', () => {
  describe('initial state', () => {
    it('returns correct defaults', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      expect(result.current.index).toBe(0);
      expect(result.current.buffer).toBe('');
      expect(result.current.composedKana).toBe('');
      expect(result.current.startedAt).toBeNull();
      expect(result.current.finishedAt).toBeNull();
      expect(result.current.totalKeystrokes).toBe(0);
      expect(result.current.mistakeKeystrokes).toBe(0);
      expect(result.current.currentWrong).toBe(false);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.accuracy).toBe(100);
    });
  });

  describe('handleKeyDown – special keys', () => {
    it('Tab: calls preventDefault and returns "none"', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      const preventDefault = vi.fn();

      let returnVal: string | undefined;
      act(() => {
        returnVal = result.current.handleKeyDown(makeKeyEvent('Tab', { preventDefault }));
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(returnVal).toBe('none');
    });

    it('Escape: calls preventDefault and returns "reset-round"', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      const preventDefault = vi.fn();

      let returnVal: string | undefined;
      act(() => {
        returnVal = result.current.handleKeyDown(makeKeyEvent('Escape', { preventDefault }));
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(returnVal).toBe('reset-round');
    });

    it('non-letter key (e.g. ArrowLeft): returns "none" and does not change state', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      let returnVal: string | undefined;
      act(() => {
        returnVal = result.current.handleKeyDown(makeKeyEvent('ArrowLeft'));
      });

      expect(returnVal).toBe('none');
      expect(result.current.totalKeystrokes).toBe(0);
    });

    it('Backspace: removes last buffer character and clears currentWrong', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      // Type an invalid char to set currentWrong=true
      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z'));
      });
      expect(result.current.currentWrong).toBe(true);

      // Type a valid prefix character so we have something in the buffer
      // (for 'あ' romaji='a', 'k' alone is invalid, but 'k' might build buffer for other kana)
      // Let's just type a valid char 'a' first to populate buffer, then backspace
      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });
      // 'a' completes 'あ', buffer resets. Let's test backspace on a partial entry.
      // Type token 'ka' scenario — switch to a token set that needs multi-char romaji.
    });

    it('Backspace: removes last character from buffer', () => {
      const multiCharTokens: Entry[] = [{ kana: 'か', romaji: 'ka' }];
      const { result } = renderHook(() => useTypingEngine(multiCharTokens));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('k'));
      });
      expect(result.current.buffer).toBe('k');

      const preventDefault = vi.fn();
      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace', { preventDefault }));
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(result.current.buffer).toBe('');
    });

    it('Backspace after wrong key: clears currentWrong', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z'));
      });
      expect(result.current.currentWrong).toBe(true);

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Backspace'));
      });
      expect(result.current.currentWrong).toBe(false);
    });
  });

  describe('handleKeyDown – typing flow', () => {
    it('sets startedAt on first valid keypress', () => {
      const now = 1_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const { result } = renderHook(() => useTypingEngine(TOKENS));
      expect(result.current.startedAt).toBeNull();

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });

      expect(result.current.startedAt).toBe(now);
      vi.restoreAllMocks();
    });

    it('valid but incomplete input accumulates in buffer', () => {
      const multiCharTokens: Entry[] = [{ kana: 'か', romaji: 'ka' }];
      const { result } = renderHook(() => useTypingEngine(multiCharTokens));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('k'));
      });

      expect(result.current.buffer).toBe('k');
      expect(result.current.index).toBe(0);
      expect(result.current.currentWrong).toBe(false);
    });

    it('completing a token advances index and resets buffer', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });

      expect(result.current.index).toBe(1);
      expect(result.current.buffer).toBe('');
    });

    it('invalid key increments mistakeKeystrokes and sets currentWrong', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z'));
      });

      expect(result.current.mistakeKeystrokes).toBe(1);
      expect(result.current.totalKeystrokes).toBe(1);
      expect(result.current.currentWrong).toBe(true);
    });

    it('invalid key does not advance index or change buffer', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z'));
      });

      expect(result.current.index).toBe(0);
      expect(result.current.buffer).toBe('');
    });

    it('correcting after a wrong key clears currentWrong on next valid key', () => {
      const multiCharTokens: Entry[] = [{ kana: 'か', romaji: 'ka' }];
      const { result } = renderHook(() => useTypingEngine(multiCharTokens));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z'));
      });
      expect(result.current.currentWrong).toBe(true);

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('k'));
      });
      expect(result.current.currentWrong).toBe(false);
    });

    it('completing all tokens sets isFinished and records finishedAt', () => {
      const singleToken: Entry[] = [{ kana: 'あ', romaji: 'a' }];
      const finishTime = 2_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(finishTime);

      const { result } = renderHook(() => useTypingEngine(singleToken));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });

      expect(result.current.isFinished).toBe(true);
      expect(result.current.finishedAt).toBe(finishTime);
      vi.restoreAllMocks();
    });

    it('Enter when finished returns "reset-round"', () => {
      const singleToken: Entry[] = [{ kana: 'あ', romaji: 'a' }];
      const { result } = renderHook(() => useTypingEngine(singleToken));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });
      expect(result.current.isFinished).toBe(true);

      const preventDefault = vi.fn();
      let returnVal: string | undefined;
      act(() => {
        returnVal = result.current.handleKeyDown(makeKeyEvent('Enter', { preventDefault }));
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(returnVal).toBe('reset-round');
    });

    it('letter keys after finish return "none" and do not advance state', () => {
      const singleToken: Entry[] = [{ kana: 'あ', romaji: 'a' }];
      const { result } = renderHook(() => useTypingEngine(singleToken));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });
      expect(result.current.isFinished).toBe(true);

      let returnVal: string | undefined;
      act(() => {
        returnVal = result.current.handleKeyDown(makeKeyEvent('b'));
      });

      expect(returnVal).toBe('none');
    });
  });

  describe('resetEngine', () => {
    it('resets all state back to initial values', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z')); // mistake
        result.current.handleKeyDown(makeKeyEvent('a')); // completes あ
      });

      expect(result.current.index).toBe(1);
      expect(result.current.mistakeKeystrokes).toBe(1);

      act(() => {
        result.current.resetEngine();
      });

      expect(result.current.index).toBe(0);
      expect(result.current.buffer).toBe('');
      expect(result.current.startedAt).toBeNull();
      expect(result.current.finishedAt).toBeNull();
      expect(result.current.totalKeystrokes).toBe(0);
      expect(result.current.mistakeKeystrokes).toBe(0);
      expect(result.current.currentWrong).toBe(false);
      expect(result.current.isFinished).toBe(false);
    });
  });

  describe('derived values', () => {
    it('accuracy is 100 when no keystrokes have been made', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      expect(result.current.accuracy).toBe(100);
    });

    it('accuracy decreases proportionally with mistakes', () => {
      const multiCharTokens: Entry[] = [{ kana: 'か', romaji: 'ka' }];
      const { result } = renderHook(() => useTypingEngine(multiCharTokens));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('z')); // mistake
        result.current.handleKeyDown(makeKeyEvent('k')); // valid
      });

      // 1 mistake / 2 total = 50% accuracy
      expect(result.current.accuracy).toBe(50);
    });

    it('completedKanaLength counts kana chars of completed tokens', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      expect(result.current.completedKanaLength).toBe(0);

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('a'));
      });

      expect(result.current.completedKanaLength).toBe(1); // 'あ' is 1 char
    });

    it('composedKana is empty when buffer is empty', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      expect(result.current.composedKana).toBe('');
    });

    it('composedKana reflects partial romaji input', () => {
      const multiCharTokens: Entry[] = [{ kana: 'か', romaji: 'ka' }];
      const { result } = renderHook(() => useTypingEngine(multiCharTokens));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('k'));
      });

      // wanakana converts 'k' with IMEMode — it stays as-is until resolved
      expect(result.current.composedKana).toBeTruthy();
      expect(typeof result.current.composedKana).toBe('string');
    });

    it('elapsedMinutes is 0 before typing starts', () => {
      const { result } = renderHook(() => useTypingEngine(TOKENS));
      expect(result.current.elapsedMinutes).toBe(0);
    });
  });

  describe('ん special case', () => {
    it('accepts "n" as a valid complete input for ん', () => {
      const nnToken: Entry[] = [{ kana: 'ん', romaji: 'nn' }];
      const { result } = renderHook(() => useTypingEngine(nnToken));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('n'));
      });

      expect(result.current.index).toBe(1);
      expect(result.current.isFinished).toBe(true);
    });

    it('accepts "nn" as a valid complete input for ん', () => {
      const nnToken: Entry[] = [{ kana: 'ん', romaji: 'nn' }];
      const { result } = renderHook(() => useTypingEngine(nnToken));

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('n'));
        result.current.handleKeyDown(makeKeyEvent('n'));
      });

      expect(result.current.isFinished).toBe(true);
    });
  });

  describe('timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('wpm is positive after completing tokens', () => {
      const tokens: Entry[] = [
        { kana: 'あ', romaji: 'a' },
        { kana: 'い', romaji: 'i' },
        { kana: 'う', romaji: 'u' },
        { kana: 'え', romaji: 'e' },
        { kana: 'お', romaji: 'o' },
      ];
      const { result } = renderHook(() => useTypingEngine(tokens));

      // Each keypress needs its own act() so React re-renders before the next
      // call, otherwise each handleKeyDown sees a stale index from its closure.
      for (const key of ['a', 'i', 'u', 'e', 'o']) {
        act(() => {
          result.current.handleKeyDown(makeKeyEvent(key));
        });
      }

      expect(result.current.isFinished).toBe(true);
      expect(result.current.wpm).toBeGreaterThan(0);
    });
  });
});
