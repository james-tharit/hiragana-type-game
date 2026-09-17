// ponytail: getVoices() can return [] on first call until 'voiceschanged'
// fires in some real browsers; not handled here. Add a voiceschanged
// listener if the "can speak" button proves flaky in practice.
export function canSpeakJapanese(): boolean {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return false;
    return synth.getVoices().some((voice) => voice.lang.startsWith("ja"));
  } catch {
    return false;
  }
}

export function speak(text: string): void {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  synth.speak(utterance);
}
