
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SpiralGarland: React.FC<{ mixVal: number }> = ({ mixVal }) => {
  const count = 400;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate Spiral Path Data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = i / count; // 0 to 1
      
      // Spiral logic
      const height = -4 + t * 11; // Bottom to Top
      const revolutions = 4;
      const angle = t * Math.PI * 2 * revolutions;
      const radius = (7 - height) * 0.6; // Slightly outside the tree surface (+offset)
      
      const targetPos = new THREE.Vector3(
        radius * Math.cos(angle),
        height,
        radius * Math.sin(angle)
      );

      // Random Chaos Pos
      const rChaos = 15;
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * rChaos,
        (Math.random() - 0.5) * rChaos,
        (Math.random() - 0.5) * rChaos
      );

      temp.push({ targetPos, chaosPos, offset: Math.random() * 100 });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Lerp Position
      dummy.position.lerpVectors(p.chaosPos, p.targetPos, mixVal);
      
      // Twinkle scale
      const twinkle = Math.sin(time * 3 + p.offset) * 0.5 + 1;
      const baseScale = 0.15;
      dummy.scale.setScalar(baseScale * twinkle * (0.5 + 0.5 * mixVal)); // Fade/Shrink slightly in Chaos
      
      dummy.rotation.z = time + p.offset;
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Star Shape (Octahedron looks like a star/diamond) */}
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#e2e8f0" 
        emissive="#fff" 
        emissiveIntensity={2} 
        toneMapped={false}
      />
    </instancedMesh>
  );
};
