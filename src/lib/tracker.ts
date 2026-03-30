import { DetectedObject } from '@tensorflow-models/coco-ssd';

export interface TrackedObject {
  id: string;
  class: string;
  bbox: [number, number, number, number]; // [x, y, width, height]
  score: number;
  lastSeen: number;
  history: { x: number, y: number, w: number, h: number, time: number }[];
  distance: 'close' | 'medium' | 'far';
  direction: 'left' | 'center' | 'right';
  movement: 'approaching' | 'receding' | 'static' | 'lateral';
}

export class ObjectTracker {
  private objects: Map<string, TrackedObject> = new Map();
  private nextId = 0;
  private readonly HISTORY_LENGTH = 5;
  private readonly FORGET_TIME_MS = 1000; // Forget object if not seen for 1s

  // Map COCO classes to our Indian street context
  private readonly CLASS_MAPPING: Record<string, string> = {
    'person': 'pedestrian',
    'car': 'vehicle',
    'motorcycle': 'bike',
    'bus': 'bus',
    'truck': 'truck',
    'bicycle': 'bicycle',
    'stop sign': 'traffic sign',
    'fire hydrant': 'obstacle',
    // We would add custom classes here for potholes, autos, etc. if using a custom model
  };

  private readonly RELEVANT_CLASSES = Object.keys(this.CLASS_MAPPING);

  update(detections: DetectedObject[], videoWidth: number, videoHeight: number) {
    const now = Date.now();
    const currentDetections = detections.filter(d => this.RELEVANT_CLASSES.includes(d.class) && d.score > 0.5);

    // Simple IoU (Intersection over Union) tracking
    const matchedIds = new Set<string>();

    for (const det of currentDetections) {
      let bestMatchId: string | null = null;
      let bestIoU = 0.3; // Threshold

      for (const [id, obj] of this.objects.entries()) {
        if (matchedIds.has(id) || obj.class !== this.CLASS_MAPPING[det.class]) continue;

        const iou = this.calculateIoU(det.bbox, obj.bbox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatchId = id;
        }
      }

      const mappedClass = this.CLASS_MAPPING[det.class];
      const [x, y, w, h] = det.bbox;
      const centerX = x + w / 2;
      
      // Determine direction (left, center, right)
      let direction: 'left' | 'center' | 'right' = 'center';
      if (centerX < videoWidth * 0.33) direction = 'left';
      else if (centerX > videoWidth * 0.66) direction = 'right';

      // Determine distance (heuristic based on bounding box height relative to screen)
      let distance: 'close' | 'medium' | 'far' = 'far';
      const heightRatio = h / videoHeight;
      if (heightRatio > 0.5) distance = 'close';
      else if (heightRatio > 0.2) distance = 'medium';

      if (bestMatchId) {
        // Update existing
        const obj = this.objects.get(bestMatchId)!;
        obj.bbox = det.bbox;
        obj.score = det.score;
        obj.lastSeen = now;
        obj.distance = distance;
        obj.direction = direction;
        
        obj.history.push({ x, y, w, h, time: now });
        if (obj.history.length > this.HISTORY_LENGTH) obj.history.shift();

        // Calculate movement
        if (obj.history.length >= 2) {
          const oldest = obj.history[0];
          const newest = obj.history[obj.history.length - 1];
          const timeDiff = newest.time - oldest.time;
          
          if (timeDiff > 0) {
            const widthGrowth = newest.w / oldest.w;
            if (widthGrowth > 1.1) obj.movement = 'approaching';
            else if (widthGrowth < 0.9) obj.movement = 'receding';
            else {
               const xDiff = Math.abs(newest.x - oldest.x);
               if (xDiff > videoWidth * 0.1) obj.movement = 'lateral';
               else obj.movement = 'static';
            }
          }
        }

        matchedIds.add(bestMatchId);
      } else {
        // Create new
        const newId = `obj_${this.nextId++}`;
        this.objects.set(newId, {
          id: newId,
          class: mappedClass,
          bbox: det.bbox,
          score: det.score,
          lastSeen: now,
          history: [{ x, y, w, h, time: now }],
          distance,
          direction,
          movement: 'static'
        });
        matchedIds.add(newId);
      }
    }

    // Cleanup old objects
    for (const [id, obj] of this.objects.entries()) {
      if (now - obj.lastSeen > this.FORGET_TIME_MS) {
        this.objects.delete(id);
      }
    }

    return Array.from(this.objects.values());
  }

  private calculateIoU(box1: number[], box2: number[]) {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const xA = Math.max(x1, x2);
    const yA = Math.max(y1, y2);
    const xB = Math.min(x1 + w1, x2 + w2);
    const yB = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - interArea;

    return interArea / unionArea;
  }
}
