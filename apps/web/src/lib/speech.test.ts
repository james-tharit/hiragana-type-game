import { afterEach, describe, expect, it, vi } from "vitest";
import { canSpeakJapanese, speak } from "./speech";

// jsdom implements neither API, so each test stubs what it needs and this
// clears it again. Casting through Record lets us delete properties that are
// non-optional on the real Window type.
const globals = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete globals.speechSynthesis;
  delete globals.SpeechSynthesisUtterance;
});

const voicesStub = (...langs: string[]) =>
  ({ getVoices: () => langs.map((lang) => ({ lang })) }) as unknown as SpeechSynthesis;

describe("canSpeakJapanese", () => {
  it("returns false when speechSynthesis is unavailable", () => {
    expect(canSpeakJapanese()).toBe(false);
  });

  it("returns false when no available voice is Japanese", () => {
    window.speechSynthesis = voicesStub("en-US", "fr-FR");

    expect(canSpeakJapanese()).toBe(false);
  });

  it("returns true when a Japanese voice is available", () => {
    window.speechSynthesis = voicesStub("en-US", "ja-JP");

    expect(canSpeakJapanese()).toBe(true);
  });
});

describe("speak", () => {
  it("cancels any current utterance and speaks a new one in Japanese", () => {
    const cancel = vi.fn();
    const speakFn = vi.fn();
    window.speechSynthesis = {
      cancel,
      speak: speakFn,
      getVoices: () => [],
    } as unknown as SpeechSynthesis;
    window.SpeechSynthesisUtterance = class {
      text: string;
      lang = "";
      constructor(text: string) {
        this.text = text;
      }
    } as unknown as typeof SpeechSynthesisUtterance;

    speak("ねこ");

    expect(cancel).toHaveBeenCalled();
    expect(speakFn).toHaveBeenCalledTimes(1);
    const utterance = speakFn.mock.calls[0][0];
    expect(utterance.lang).toBe("ja-JP");
    expect(utterance.text).toBe("ねこ");
  });

  it("does not throw when speech synthesis is unavailable", () => {
    expect(() => speak("ねこ")).not.toThrow();
  });
});
