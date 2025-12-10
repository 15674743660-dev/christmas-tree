
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow = () => {
  const count = 1500;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        t: Math.random() * 100,
        factor: 20 + Math.random() * 100,
        speed: 0.005 + Math.random() * 0.015,
        xFactor: -50 + Math.random() * 100,
        yFactor: -50 + Math.random() * 100,
        zFactor: -50 + Math.random() * 100,
        scale: 0.2 + Math.random() * 0.6, // Fixed random scale
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed; // Linear accumulation for position
      
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      
      dummy.position.set(
        xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      // Fall down
      dummy.position.y -= t * 0.8;
      
      // Loop
      if (dummy.position.y < -15) {
          particle.t = 0;
          dummy.position.y = 25;
      }

      // No pulsing size - fixed scale
      dummy.scale.setScalar(particle.scale);
      
      // Constant rotation for flutter
      dummy.rotation.x += particle.rotSpeed;
      dummy.rotation.y += particle.rotSpeed;
      dummy.rotation.z += particle.rotSpeed;
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      {/* Octahedron looks more like a crystal/snowflake than a sphere */}
      <octahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial 
        color="#E0F2FE" 
        emissive="#E0F2FE" 
        emissiveIntensity={0.8} 
        toneMapped={false} 
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
};
