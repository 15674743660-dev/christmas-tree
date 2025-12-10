
import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

import { PineNeedles } from './Visuals/TreeShader';
import { Ornaments } from './Visuals/Ornaments';
import { Snow } from './Visuals/Snow';
import { Polaroids } from './Visuals/Polaroids';
import { SpiralGarland } from './Visuals/SpiralGarland';
import { TreeTop } from './Visuals/TreeTop';
import { TreeMode, HandData, PhotoData } from '../types';

interface SceneProps {
  mode: TreeMode;
  handData: HandData;
  photos: PhotoData[];
}

const SceneContent: React.FC<SceneProps> = ({ mode, handData, photos }) => {
  const [mixVal, setMixVal] = useState(1);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // 1 = Formed (Tree), 0 = Chaos (Open)
    const targetMix = mode === TreeMode.FORMED ? 1 : 0;
    
    // Smooth transition - Slower for cinematic feel
    const newMix = THREE.MathUtils.lerp(mixVal, targetMix, delta * 0.8);
    setMixVal(newMix);

    if (groupRef.current) {
        // Continuous rotation - Slow and majestic
        groupRef.current.rotation.y += delta * 0.08;
        
        // Interactive rotation using Hand Data
        // If user moves hand left/right, it adds torque
        const rotationSpeed = (handData.x - 0.5) * 1.5;
        groupRef.current.rotation.y += rotationSpeed * delta;
    }

    // Camera Parallax based on Hand Position
    // Moves camera slightly opposite to hand to create depth
    const targetCamX = (handData.x - 0.5) * 4; 
    const targetCamY = (handData.y - 0.5) * 2 + 1.5; 
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, delta * 1.0);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, delta * 1.0);
    state.camera.lookAt(0, 1.0, 0); // Look at center of tree
  });

  return (
    <>
      <group ref={groupRef}>
        <PineNeedles mixVal={mixVal} />
        <Ornaments mixVal={mixVal} />
        <SpiralGarland mixVal={mixVal} />
        <TreeTop mixVal={mixVal} />
        
        {/* Polaroids need Suspense for texture loading */}
        <Suspense fallback={null}>
           <Polaroids photos={photos} mixVal={mixVal} />
        </Suspense>
        
        {/* Core Glow */}
        <pointLight position={[0, 2, 0]} intensity={3} color="#fbbf24" distance={8} decay={2} />
      </group>
      
      <Snow />

      <ambientLight intensity={0.2} />
      {/* Cool Moonlight */}
      <spotLight position={[15, 20, 10]} angle={0.6} penumbra={1} intensity={1.5} color="#c7d2fe" castShadow />
      {/* Warm Firelight */}
      <pointLight position={[-8, 0, 8]} intensity={1.5} color="#f87171" distance={20} />
      
      <Environment preset="night" blur={0.6} background={false} />
    </>
  );
};

export const Scene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}>
        {/* Adjusted Camera Z to ensure photos don't clip when flying out */}
        <PerspectiveCamera makeDefault position={[0, 2, 32]} fov={35} />
        
        {/* Suspense Wrapper is critical for preventing crashes when images load */}
        <Suspense fallback={null}>
            <SceneContent {...props} />
        </Suspense>
        
        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.7} 
                mipmapBlur 
                intensity={1.8} 
                radius={0.5} 
                levels={6}
            />
            <Vignette eskil={false} offset={0.2} darkness={1.1} />
            <Noise opacity={0.05} />
        </EffectComposer>
    </Canvas>
  );
};
