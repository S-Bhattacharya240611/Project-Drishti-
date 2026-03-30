// Handles Text-to-Speech with priority and debouncing
export class AudioEngine {
  private synth: SpeechSynthesis;
  private lastSpokenTime: Record<string, number> = {};
  private isSpeaking: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, priority: number = 0, category: string = 'general') {
    const now = Date.now();
    // Debounce same category alerts (e.g., don't say "car ahead" every second)
    const debounceTime = priority > 5 ? 2000 : 5000; // High priority: 2s, Low: 5s

    if (this.lastSpokenTime[category] && now - this.lastSpokenTime[category] < debounceTime) {
      return;
    }

    if (this.isSpeaking && priority < 5) {
      // Skip low priority if already speaking
      return;
    }

    if (this.isSpeaking && priority >= 5) {
      // Interrupt for high priority
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a clear, calm voice (preferably Indian English if available)
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-GB')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 1.1; // Slightly faster but clear
    utterance.pitch = 1.0;

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = () => { this.isSpeaking = false; };

    this.synth.speak(utterance);
    this.lastSpokenTime[category] = now;
  }

  stop() {
    this.synth.cancel();
    this.isSpeaking = false;
  }
}
