import { afterEach, describe, expect, it, vi } from "vitest";
import { playSentenceAudio } from "./audio";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("playSentenceAudio", () => {
  it("resolves once the underlying play() promise resolves, so callers can await playback actually starting", async () => {
    let resolvePlay!: () => void;
    const playPromise = new Promise<void>((resolve) => {
      resolvePlay = resolve;
    });
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockReturnValue(playPromise);

    const result = playSentenceAudio(12345);
    resolvePlay();

    await expect(result).resolves.toBeUndefined();
  });

  it("rejects when the underlying play() promise rejects, instead of swallowing the failure", async () => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockRejectedValue(
      new Error("blocked"),
    );

    await expect(playSentenceAudio(12345)).rejects.toThrow("blocked");
  });

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
