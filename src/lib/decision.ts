import { TrackedObject } from './tracker';
import { AudioEngine } from './audio';

export class DecisionEngine {
  private audio: AudioEngine;

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  process(objects: TrackedObject[]) {
    if (objects.length === 0) return;

    // Prioritize objects:
    // 1. Close and approaching
    // 2. Close
    // 3. Medium and approaching
    
    // Sort by threat level
    const sortedObjects = [...objects].sort((a, b) => {
      const scoreA = this.getThreatScore(a);
      const scoreB = this.getThreatScore(b);
      return scoreB - scoreA; // Descending
    });

    const primaryThreat = sortedObjects[0];
    const threatScore = this.getThreatScore(primaryThreat);

    if (threatScore > 50) {
      // High priority alert
      let message = `${primaryThreat.class} `;
      if (primaryThreat.movement === 'approaching') {
        message += `approaching from ${primaryThreat.direction}`;
      } else {
        message += `ahead on ${primaryThreat.direction}`;
      }

      if (primaryThreat.distance === 'close') {
        message += ', stop';
        this.audio.speak(message, 10, `danger_${primaryThreat.class}`);
      } else {
        this.audio.speak(message, 7, `warning_${primaryThreat.class}`);
      }
    } else if (threatScore > 20) {
      // Medium priority
      this.audio.speak(`${primaryThreat.class} on ${primaryThreat.direction}`, 3, `info_${primaryThreat.class}`);
    }
  }

  private getThreatScore(obj: TrackedObject): number {
    let score = 0;
    
    // Distance factor
    if (obj.distance === 'close') score += 50;
    else if (obj.distance === 'medium') score += 20;
    else score += 5;

    // Movement factor
    if (obj.movement === 'approaching') score += 30;
    else if (obj.movement === 'lateral') score += 10;

    // Class factor (vehicles are more dangerous)
    if (['vehicle', 'bus', 'truck', 'bike'].includes(obj.class)) score += 20;
    
    // Direction factor (center is more dangerous)
    if (obj.direction === 'center') score += 15;

    return score;
  }
}
