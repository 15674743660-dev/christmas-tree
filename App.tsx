
import React, { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { VisionController } from './components/VisionController';
import { TreeMode, HandData, PhotoData } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<TreeMode>(TreeMode.FORMED);
  const [handData, setHandData] = useState<HandData>({ state: 'NONE', x: 0.5, y: 0.5 });
  const [photos, setPhotos] = useState<PhotoData[]>([]); 

  // Memoize handler to prevent downstream re-renders
  const handleHandUpdate = useCallback((data: HandData) => {
    // If motion detected (OPEN), switch to Chaos
    if (data.state === 'OPEN') {
        setMode(TreeMode.CHAOS);
    } else if (data.state === 'CLOSED') {
        setMode(TreeMode.FORMED);
    }

    // Heavy Smoothing for Camera (Low Pass Filter)
    // 0.95 retention = Very slow, smooth drift
    setHandData(prev => {
        // Only update if difference is significant to save frames
        if (Math.abs(prev.x - data.x) < 0.005 && Math.abs(prev.y - data.y) < 0.005) {
            return prev;
        }
        return {
            ...prev,
            x: prev.x * 0.95 + data.x * 0.05,
            y: prev.y * 0.95 + data.y * 0.05
        };
    });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: PhotoData[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        aspectRatio: 1
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  // Mouse Overrides
  const handlePointerDown = () => setMode(TreeMode.CHAOS);
  const handlePointerUp = () => setMode(TreeMode.FORMED);
  const handlePointerMove = (e: React.PointerEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    // Manual overrides are instant
    setHandData(prev => ({ ...prev, x, y }));
  };

  return (
    <div 
        className="relative w-full h-screen bg-[#020617] text-white overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
    >
      {/* 3D Scene */}
      <Scene mode={mode} handData={handData} photos={photos} />

      {/* Vision Controller (Motion Detection) */}
      <VisionController onHandUpdate={handleHandUpdate} />

      {/* "Merry Christmas" Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${mode === TreeMode.CHAOS ? 'opacity-100' : 'opacity-0'}`}
      >
         <h1 className="text-5xl md:text-9xl font-['Cinzel'] font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-200 to-amber-600 drop-shadow-[0_0_35px_rgba(251,191,36,0.8)] text-center tracking-widest leading-none z-30">
            MERRY<br/>CHRISTMAS
         </h1>
      </div>

      {/* Bottom UI Controls */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center items-center gap-6 pointer-events-none z-50">
            <label className="pointer-events-auto cursor-pointer group relative overflow-hidden rounded-full hover:scale-105 transition-transform duration-300">
                <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                <div className="px-10 py-4 bg-emerald-950/80 backdrop-blur-xl border border-emerald-400/30 text-emerald-100 font-['Cinzel'] tracking-[0.2em] uppercase text-sm group-hover:bg-emerald-900 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2">
                    <span>✦ Add Memories</span>
                </div>
            </label>
      </div>
    </div>
  );
};

export default App;
