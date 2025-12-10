
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const TreeMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMix: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMix;
    attribute vec3 aTargetPos;
    attribute vec3 aChaosPos;
    attribute vec3 aColor;
    attribute float aSize;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Lerp between chaos and tree
      vec3 pos = mix(aChaosPos, aTargetPos, uMix);
      
      // Gentle wind/breathing
      float breathe = sin(uTime * 1.0 + pos.y * 0.5) * 0.05 * uMix;
      pos.x += breathe;
      pos.z += breathe;

      // Chaos swirl
      if (uMix < 0.9) {
          float swirl = (1.0 - uMix) * 2.0;
          pos.x += sin(uTime + pos.y) * 0.2 * swirl;
          pos.y += cos(uTime * 0.8 + pos.x) * 0.2 * swirl;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Size attenuation
      gl_PointSize = aSize * (25.0 / -mvPosition.z); 
      
      gl_Position = projectionMatrix * mvPosition;

      vColor = aColor;
      vAlpha = 0.5 + 0.5 * uMix;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Soft brush stroke shape
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;

      // Soft gradient instead of hard sphere
      float alpha = smoothstep(0.5, 0.0, dist);
      
      // Add a slight noise/texture feel
      vec3 finalColor = mix(vColor, vec3(1.0), alpha * 0.1);
      
      gl_FragColor = vec4(finalColor, vAlpha * alpha * 1.5);
    }
  `
};

export const PineNeedles: React.FC<{ mixVal: number }> = ({ mixVal }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const count = 7500; 

  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const chaosPos = [];
    const targetPos = [];
    const colors = [];
    const sizes = [];
    
    const cGreen1 = new THREE.Color('#064e3b'); // Dark Emerald
    const cGreen2 = new THREE.Color('#10b981'); // Emerald
    const cRed = new THREE.Color('#ef4444');    // Bright Red
    const cDarkRed = new THREE.Color('#7f1d1d'); // Dark Red

    for (let i = 0; i < count; i++) {
      // Chaos: Sphere Explosion
      const rChaos = 12 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      chaosPos.push(
        rChaos * Math.sin(phi) * Math.cos(theta),
        rChaos * Math.sin(phi) * Math.sin(theta),
        rChaos * Math.cos(phi)
      );

      // Target: Dense Cone
      // Height: -4 to 7
      const h = -4 + Math.random() * 11; 
      // Radius: Linear cone
      const maxR = (7 - h) * 0.55; 
      const r = Math.sqrt(Math.random()) * maxR; 
      const angle = Math.random() * Math.PI * 2;
      
      targetPos.push(
        r * Math.cos(angle),
        h,
        r * Math.sin(angle)
      );

      // Color Palette
      const rand = Math.random();
      if (rand > 0.92) {
          // Red Berries
          const c = Math.random() > 0.5 ? cRed : cDarkRed;
          colors.push(c.r, c.g, c.b);
          sizes.push(10.0 + Math.random() * 8.0);
      } else {
          // Green Leaves (Mix of dark and light for depth)
          const c = Math.random() > 0.6 ? cGreen1 : cGreen2;
          // Vary brightness slightly
          const tint = 0.8 + Math.random() * 0.4;
          colors.push(c.r * tint, c.g * tint, c.b * tint);
          sizes.push(4.0 + Math.random() * 6.0);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(chaosPos, 3)); 
    geometry.setAttribute('aChaosPos', new THREE.Float32BufferAttribute(chaosPos, 3));
    geometry.setAttribute('aTargetPos', new THREE.Float32BufferAttribute(targetPos, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      shaderRef.current.uniforms.uMix.value = mixVal;
    }
  });

  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[TreeMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};
