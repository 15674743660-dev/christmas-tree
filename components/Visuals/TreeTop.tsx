
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const TreeTop: React.FC<{ mixVal: number }> = ({ mixVal }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.6;
    const innerRadius = 0.3; // Classic 5-point star ratio

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2; // Rotate to point up
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
        const time = state.clock.elapsedTime;
        
        // Gentle rotation
        groupRef.current.rotation.y = time * 0.8;

        // Position Logic: Top of tree
        const targetPos = new THREE.Vector3(0, 7.8, 0); // Slightly higher for the star
        const chaosPos = new THREE.Vector3(0, 6, 10);
        
        groupRef.current.position.lerpVectors(chaosPos, targetPos, mixVal);
        
        // Scale pulse
        const pulse = 1 + Math.sin(time * 1.5) * 0.05;
        // Keep it relatively small/minimalist
        const scale = THREE.MathUtils.lerp(0.5, 1.0, mixVal) * pulse;
        groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={1.5} 
            roughness={0.2}
            metalness={1}
            toneMapped={false} 
        />
      </mesh>
      
      {/* Golden Glow Light */}
      <pointLight color="#fbbf24" intensity={2} distance={6} decay={2} position={[0, 0, 0.5]} />
    </group>
  );
};
