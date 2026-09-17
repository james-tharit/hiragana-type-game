export function playSentenceAudio(audioId: number): void {
  const audio = new Audio(`https://tatoeba.org/audio/download/${audioId}`);
  audio.play().catch(() => {});
}
