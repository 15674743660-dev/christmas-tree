
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Ornaments: React.FC<{ mixVal: number }> = ({ mixVal }) => {
  const count = 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create dummy object for positioning
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions
  const data = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // Tree Position (Surface of cone)
      const h = Math.random() * 11 - 4; // Height
      const maxRadius = (8 - h) * 0.45; // Slightly outside the foliage
      const angle = Math.random() * Math.PI * 2;
      
      const targetPos = new THREE.Vector3(
        maxRadius * Math.cos(angle),
        h,
        maxRadius * Math.sin(angle)
      );

      // Chaos Position (Far out)
      const rChaos = 10 + Math.random() * 10;
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * rChaos,
        (Math.random() - 0.5) * rChaos,
        (Math.random() - 0.5) * rChaos
      );

      const scale = 0.2 + Math.random() * 0.3; // Ornament size
      // Gold Only
      const color = '#fbbf24'; 

      temp.push({ targetPos, chaosPos, scale, color: new THREE.Color(color) });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    data.forEach((d, i) => {
      // Interpolate position
      dummy.position.lerpVectors(d.chaosPos, d.targetPos, mixVal);
      
      // Hover effect
      dummy.position.y += Math.sin(state.clock.elapsedTime + i) * 0.005;

      dummy.scale.setScalar(d.scale * (0.5 + 0.5 * mixVal)); // Smaller in chaos mode
      dummy.rotation.set(state.clock.elapsedTime * 0.5, state.clock.elapsedTime * 0.5, 0);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, d.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};
