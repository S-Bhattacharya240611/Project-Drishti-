import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export class VisionEngine {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitializing = false;

  async initialize() {
    if (this.model || this.isInitializing) return;
    this.isInitializing = true;
    try {
      // Set WASM backend for better performance on mobile/offline
      await tf.setBackend('wasm');
      await tf.ready();
      
      // Load COCO-SSD (In a real scenario, this would be a custom model trained on Indian streets)
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, lighter model
      });
      console.log('Vision Engine initialized with WASM backend');
    } catch (e) {
      console.error('Failed to initialize Vision Engine', e);
      // Fallback to webgl if wasm fails
      await tf.setBackend('webgl');
      await tf.ready();
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.log('Vision Engine initialized with WebGL fallback');
    } finally {
      this.isInitializing = false;
    }
  }

  async detect(videoElement: HTMLVideoElement) {
    if (!this.model) return [];
    try {
      // Perform detection
      const predictions = await this.model.detect(videoElement);
      return predictions;
    } catch (e) {
      console.error('Detection error', e);
      return [];
    }
  }
}
