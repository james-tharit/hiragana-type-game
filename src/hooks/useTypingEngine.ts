import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { toHiragana } from 'wanakana';
import type { Entry } from '../constants/kanaGroups';

type KeyResult = 'none' | 'reset-round';

type UseTypingEngineResult = {
  index: number;
  buffer: string;
  composedKana: string;
  startedAt: number | null;
  finishedAt: number | null;
  totalKeystrokes: number;
  mistakeKeystrokes: number;
  currentWrong: boolean;
  isFinished: boolean;
  elapsedMinutes: number;
  completedKanaLength: number;
  wpm: number;
  accuracy: number;
  resetEngine: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => KeyResult;
};

type InputCheck = {
  valid: boolean;
  complete: boolean;
};

function getRomajiCandidates(targetRomaji: string, targetKana: string): string[] {
  if (targetKana !== 'ん') {
    return [targetRomaji];
  }

  const variants = new Set<string>([targetRomaji, 'n', 'nn', "n'", 'xn']);
  return Array.from(variants);
}

function checkInput(buffer: string, targetRomaji: string, targetKana: string): InputCheck {
  const normalizedBuffer = buffer.toLowerCase();
  const candidates = getRomajiCandidates(targetRomaji, targetKana);

  const romajiPrefixMatch = candidates.some((candidate) => candidate.startsWith(normalizedBuffer));
  const romajiCompleteMatch = candidates.some((candidate) => candidate === normalizedBuffer);

  const composed = toHiragana(normalizedBuffer, { IMEMode: true });
  const hasUnresolvedLatin = /[a-z]/i.test(composed);
  const kanaOnly = composed.replace(/[a-z]/gi, '');
  const kanaPrefixMatch = kanaOnly.length > 0 && targetKana.startsWith(kanaOnly);
  const kanaCompleteMatch = kanaOnly === targetKana && !hasUnresolvedLatin;

  return {
    valid: romajiPrefixMatch || kanaPrefixMatch,
    complete: romajiCompleteMatch || kanaCompleteMatch,
  };
}

export function useTypingEngine(tokens: Entry[]): UseTypingEngineResult {
  const [index, setIndex] = useState(0);
  const [buffer, setBuffer] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [mistakeKeystrokes, setMistakeKeystrokes] = useState(0);
  const [currentWrong, setCurrentWrong] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const isFinished = index >= tokens.length;

  useEffect(() => {
    if (!startedAt || finishedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => {
      window.clearInterval(timer);
    };
  }, [startedAt, finishedAt]);

  const composedKana = useMemo(() => {
    if (!buffer) {
      return '';
    }

    return toHiragana(buffer, { IMEMode: true });
  }, [buffer]);

  const completedKanaLength = useMemo(
    () => tokens.slice(0, index).reduce((sum, token) => sum + token.kana.length, 0),
    [tokens, index],
  );

  const elapsedMinutes = useMemo(() => {
    if (!startedAt) {
      return 0;
    }

    const end = finishedAt ?? now;
    return Math.max((end - startedAt) / 60000, 1 / 60000);
  }, [startedAt, finishedAt, now]);

  const wpm = useMemo(() => {
    return Math.round((completedKanaLength / 5 / elapsedMinutes) * 10) / 10;
  }, [completedKanaLength, elapsedMinutes]);

  const accuracy = useMemo(() => {
    if (totalKeystrokes === 0) {
      return 100;
    }

    return Math.max(0, ((totalKeystrokes - mistakeKeystrokes) / totalKeystrokes) * 100);
  }, [totalKeystrokes, mistakeKeystrokes]);

  const resetEngine = () => {
    setIndex(0);
    setBuffer('');
    setStartedAt(null);
    setFinishedAt(null);
    setTotalKeystrokes(0);
    setMistakeKeystrokes(0);
    setCurrentWrong(false);
    setNow(Date.now());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): KeyResult => {
    if (event.key === 'Tab') {
      event.preventDefault();
      return 'none';
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      return 'reset-round';
    }

    if (event.key === 'Enter' && isFinished) {
      event.preventDefault();
      return 'reset-round';
    }

    if (isFinished) {
      return 'none';
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      setBuffer((prev) => prev.slice(0, -1));
      setCurrentWrong(false);
      return 'none';
    }

    if (!/^[a-zA-Z']$/.test(event.key)) {
      return 'none';
    }

    event.preventDefault();

    if (!startedAt) {
      setStartedAt(Date.now());
    }

    const nextBuffer = `${buffer}${event.key.toLowerCase()}`;
    const target = tokens[index];
    if (!target) {
      return 'none';
    }

    const inputCheck = checkInput(nextBuffer, target.romaji, target.kana);
    setTotalKeystrokes((prev) => prev + 1);

    if (!inputCheck.valid) {
      setMistakeKeystrokes((prev) => prev + 1);
      setCurrentWrong(true);
      return 'none';
    }

    setCurrentWrong(false);

    if (inputCheck.complete) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      setBuffer('');

      if (nextIndex >= tokens.length) {
        setFinishedAt(Date.now());
      }
      return 'none';
    }

    setBuffer(nextBuffer);
    return 'none';
  };

  return {
    index,
    buffer,
    composedKana,
    startedAt,
    finishedAt,
    totalKeystrokes,
    mistakeKeystrokes,
    currentWrong,
    isFinished,
    elapsedMinutes,
    completedKanaLength,
    wpm,
    accuracy,
    resetEngine,
    handleKeyDown,
  };
}