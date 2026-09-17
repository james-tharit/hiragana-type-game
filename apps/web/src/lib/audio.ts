export function playSentenceAudio(audioId: number): Promise<void> {
  const audio = new Audio(`https://tatoeba.org/audio/download/${audioId}`);
  return audio.play();
}
