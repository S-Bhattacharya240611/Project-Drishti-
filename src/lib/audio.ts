// Handles Text-to-Speech and Haptic Feedback with priority and debouncing
export class AudioEngine {
  private synth: SpeechSynthesis;
  private lastSpokenTime: Record<string, number> = {};
  private isSpeaking: boolean = false;
  private language: 'en-IN' | 'hi-IN' = 'en-IN';

  constructor() {
    this.synth = window.speechSynthesis;
  }

  setLanguage(lang: 'en-IN' | 'hi-IN') {
    this.language = lang;
    const msg = lang === 'hi-IN' ? 'भाषा बदली गई' : 'Language changed to English';
    this.speak(msg, 5, 'system');
  }

  speak(text: string, priority: number = 0, category: string = 'general') {
    const now = Date.now();
    const debounceTime = priority > 5 ? 1500 : 4000; 

    if (this.lastSpokenTime[category] && now - this.lastSpokenTime[category] < debounceTime) {
      return;
    }

    if (this.isSpeaking && priority < 8) return;

    if (this.isSpeaking && priority >= 8) {
      this.synth.cancel();
    }

    // Trigger Haptics for high priority
    if (priority >= 7) {
      this.vibrate(priority >= 9 ? [200, 100, 200] : 200);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.synth.getVoices();
    
    // Auto-select best voice for chosen language
    const preferredVoice = voices.find(v => v.lang === this.language) || 
                          voices.find(v => v.lang.startsWith(this.language.split('-')[0])) ||
                          voices.find(v => v.lang.includes('en-IN')) || 
                          voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = () => { this.isSpeaking = false; };

    this.synth.speak(utterance);
    this.lastSpokenTime[category] = now;
  }

  vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  stop() {
    this.synth.cancel();
    this.isSpeaking = false;
    if ('vibrate' in navigator) navigator.vibrate(0);
  }
}
