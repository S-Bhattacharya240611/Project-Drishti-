import React, { useEffect, useRef, useState } from 'react';
import { VisionEngine } from '../lib/vision';
import { ObjectTracker, TrackedObject } from '../lib/tracker';
import { DecisionEngine } from '../lib/decision';
import { AudioEngine } from '../lib/audio';

interface CameraViewProps {
  isActive: boolean;
  onStatusChange: (status: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ isActive, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const engineRefs = useRef({
    vision: new VisionEngine(),
    tracker: new ObjectTracker(),
    audio: new AudioEngine(),
    decision: null as DecisionEngine | null,
    animationFrameId: 0
  });

  useEffect(() => {
    engineRefs.current.decision = new DecisionEngine(engineRefs.current.audio);
    
    const init = async () => {
      onStatusChange('Initializing AI Model (WASM)...');
      await engineRefs.current.vision.initialize();
      setIsReady(true);
      onStatusChange('Ready');
    };
    init();

    return () => {
      engineRefs.current.audio.stop();
      if (engineRefs.current.animationFrameId) {
        cancelAnimationFrame(engineRefs.current.animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isActive || !isReady || !videoRef.current) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onStatusChange('Camera access is not supported or requires a secure context (HTTPS).');
        return;
      }

      try {
        onStatusChange('Starting camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          onStatusChange('System Active - Monitoring Surroundings');
          engineRefs.current.audio.speak('System active. Monitoring surroundings.', 10, 'system');
          processFrame();
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
        onStatusChange('Camera access denied or unavailable.');
        engineRefs.current.audio.speak('Error accessing camera.', 10, 'system');
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (engineRefs.current.animationFrameId) {
        cancelAnimationFrame(engineRefs.current.animationFrameId);
      }
      engineRefs.current.audio.stop();
      if (isReady && isActive === false) {
          onStatusChange('System Paused');
      }
    };

    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return stopCamera;
  }, [isActive, isReady]);

  const processFrame = async () => {
    if (!isActive || !videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 1. Detect
      const rawDetections = await engineRefs.current.vision.detect(video);
      
      // 2. Track
      const trackedObjects = engineRefs.current.tracker.update(rawDetections, video.videoWidth, video.videoHeight);
      
      // 3. Decide & Speak
      engineRefs.current.decision?.process(trackedObjects);

      // 4. Draw (for sighted assistance/debugging)
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDetections(ctx, trackedObjects);
      }
    }

    // Throttle inference slightly to save battery (e.g., ~10-15 fps is enough for walking)
    setTimeout(() => {
      if (isActive) {
        engineRefs.current.animationFrameId = requestAnimationFrame(processFrame);
      }
    }, 100); 
  };

  const drawDetections = (ctx: CanvasRenderingContext2D, objects: TrackedObject[]) => {
    objects.forEach(obj => {
      const [x, y, w, h] = obj.bbox;
      
      // Color based on distance
      let color = '#00FF00'; // Far
      if (obj.distance === 'close') color = '#FF0000';
      else if (obj.distance === 'medium') color = '#FFFF00';

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);

      // Label
      ctx.fillStyle = color;
      ctx.font = '18px Arial';
      ctx.fillText(`${obj.class} (${obj.movement})`, x, y > 20 ? y - 5 : y + 20);
    });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {!isActive && isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <p className="text-white text-lg font-medium">Camera Paused</p>
        </div>
      )}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm font-medium">Loading Offline AI Model...</p>
          </div>
        </div>
      )}
    </div>
  );
};
