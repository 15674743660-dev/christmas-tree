
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { HandData } from '../types';

interface VisionControllerProps {
  onHandUpdate: (data: HandData) => void;
}

export const VisionController: React.FC<VisionControllerProps> = ({ onHandUpdate }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);
  const cooldownRef = useRef<number>(0);
  const [motionLevel, setMotionLevel] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Performance fix

    const interval = setInterval(() => {
      if (!webcamRef.current) return;
      
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;
      if (!ctx) return;

      const w = 64; 
      const h = 48;
      
      // Draw frame
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      let sumX = 0;
      let sumY = 0;
      let diffCount = 0;

      if (prevFrameData.current) {
        for (let i = 0; i < data.length; i += 4) {
          // Compare Green channel (usually least noisy)
          const diff = Math.abs(data[i+1] - prevFrameData.current[i+1]);
          
          if (diff > 40) { // Slightly higher threshold to ignore grain
            const index = i / 4;
            const x = index % w;
            const y = Math.floor(index / w);
            
            // Mirror x 
            sumX += (w - 1 - x); 
            sumY += y;
            diffCount++;
          }
        }
      }
      
      prevFrameData.current = data;

      // --- Analysis ---
      
      const totalPixels = w * h;
      const motionRatio = diffCount / totalPixels;
      setMotionLevel(Math.min(motionRatio * 8, 1)); // Visual feedback amplified

      let currentX = 0.5;
      let currentY = 0.5;

      // Calculate centroid if movement exists
      if (diffCount > 5) { 
        currentX = (sumX / diffCount) / w;
        currentY = (sumY / diffCount) / h;
      }

      // --- Gesture State Logic ---
      
      // Threshold: 5% of pixels moving (Lowered from 0.08 for better sensitivity)
      if (motionRatio > 0.05) {
        cooldownRef.current = 15; // Keep open for ~1.5 seconds
        onHandUpdate({ state: 'OPEN', x: currentX, y: currentY });
      } else {
        if (cooldownRef.current > 0) {
            cooldownRef.current--;
            // Decaying state... stay open
             onHandUpdate({ state: 'OPEN', x: currentX, y: currentY });
        } else {
            // "Fist" or "Still" -> Closed
            // Pass the last known coordinates if still to prevent camera snapping back
            onHandUpdate({ state: 'CLOSED', x: currentX, y: currentY });
        }
      }

    }, 100); // 10 FPS

    return () => clearInterval(interval);
  }, [onHandUpdate]);

  return (
    <div className="absolute top-8 right-8 z-40 flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={64} height={48} className="hidden" />

      {/* Magic Mirror Preview - Doubled Size (250px) */}
      <div className="relative w-[250px] h-[250px] rounded-full border-4 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden bg-black/50 backdrop-blur-sm">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover scale-x-[-1] opacity-90" 
            videoConstraints={{
                width: 320,
                height: 240,
                facingMode: "user"
            }}
          />
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"></div>
      </div>

      {/* Motion Energy Bar - Width Matching Container */}
      <div className="w-full max-w-[250px] bg-black/50 rounded-full h-2 border border-white/10 overflow-hidden relative">
          <div 
            className={`h-full transition-all duration-200 ${motionLevel > 0.4 ? 'bg-emerald-400 shadow-[0_0_15px_#34d399]' : 'bg-red-500/50'}`}
            style={{ width: `${motionLevel * 100}%` }}
          />
      </div>

      <div className="text-center">
        <p className="text-emerald-200/70 text-[10px] font-['Lato'] tracking-widest uppercase">
            Wave to Unleash
        </p>
      </div>
    </div>
  );
};
