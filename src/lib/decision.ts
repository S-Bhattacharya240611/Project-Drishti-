import { TrackedObject } from './tracker';
import { AudioEngine } from './audio';

export class DecisionEngine {
  private audio: AudioEngine;
  private currentLanguage: 'en-IN' | 'hi-IN' = 'en-IN';

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  setLanguage(lang: 'en-IN' | 'hi-IN') {
    this.currentLanguage = lang;
  }

  process(objects: TrackedObject[]) {
    if (objects.length === 0) return;

    const sortedObjects = [...objects].sort((a, b) => {
      const scoreA = this.getThreatScore(a);
      const scoreB = this.getThreatScore(b);
      return scoreB - scoreA;
    });

    const primaryThreat = sortedObjects[0];
    const threatScore = this.getThreatScore(primaryThreat);

    if (threatScore > 50) {
      this.announceThreat(primaryThreat, true);
    } else if (threatScore > 20) {
      this.announceThreat(primaryThreat, false);
    }
  }

  private announceThreat(obj: TrackedObject, isDanger: boolean) {
    const isHindi = this.currentLanguage === 'hi-IN';
    
    // Direction mapping
    const dirs: Record<string, any> = {
      'left': { en: 'left', hi: 'बाएँ' },
      'right': { en: 'दाएँ', hi: 'right' }, // swapping for voice clarity
      'center': { en: 'ahead', hi: 'सामने' }
    };
    
    // Class mapping for voice
    const classes: Record<string, any> = {
      'pedestrian': { en: 'person', hi: 'इंसान' },
      'vehicle': { en: 'car', hi: 'गाड़ी' },
      'bike': { en: 'bike', hi: 'मोटर साइकिल' },
      'bus': { en: 'bus', hi: 'बस' },
      'truck': { en: 'truck', hi: 'ट्रक' }
    };

    const dir = dirs[obj.direction] || dirs['center'];
    const cls = classes[obj.class] || { en: obj.class, hi: obj.class };

    let message = '';
    if (isHindi) {
        message = isDanger ? `रुको! ${dir.hi} से ${cls.hi} आ रही है` : `${dir.hi} पर ${cls.hi}`;
    } else {
        message = isDanger ? `Stop! ${cls.en} approaching from ${dir.en}` : `${cls.en} ${dir.en}`;
    }

    this.audio.speak(message, isDanger ? 10 : 4, `${isDanger ? 'danger' : 'info'}_${obj.id}`);
  }

  private getThreatScore(obj: TrackedObject): number {
    let score = 0;
    if (obj.distance === 'close') score += 50;
    else if (obj.distance === 'medium') score += 20;
    
    if (obj.movement === 'approaching') score += 35;
    if (['vehicle', 'bus', 'truck'].includes(obj.class)) score += 20;
    if (obj.direction === 'center') score += 15;
    return score;
  }
}
