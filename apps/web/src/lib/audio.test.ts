import { afterEach, describe, expect, it, vi } from "vitest";
import { playSentenceAudio } from "./audio";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("playSentenceAudio", () => {
  it("plays the Tatoeba audio URL for the given recording's audio id", () => {
    const play = vi
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);

    playSentenceAudio(12345);

    expect(play).toHaveBeenCalledTimes(1);
    const audio = play.mock.instances[0] as unknown as HTMLAudioElement;
    expect(audio.src).toBe("https://tatoeba.org/audio/download/12345");
  });
});
