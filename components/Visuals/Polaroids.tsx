
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { PhotoData } from '../../types';

interface PolaroidProps {
  photo: PhotoData;
  index: number;
  total: number;
  mixVal: number;
  targetPos: THREE.Vector3;
  targetRot: THREE.Quaternion;
  normalDir: THREE.Vector3;
}

const PolaroidItem: React.FC<PolaroidProps> = ({ 
  photo, mixVal, targetPos, targetRot, normalDir 
}) => {
  const group = useRef<THREE.Group>(null);
  const paperMat = useRef<THREE.MeshStandardMaterial>(null);
  const backMat = useRef<THREE.MeshBasicMaterial>(null);
  const imgRef = useRef<any>(null); 

  useFrame((state) => {
    if (group.current) {
        // --- 1. Position Logic ---
        // mixVal: 1 = Tree (Formed), 0 = Chaos (Unleashed)
        
        // Start: On the tree surface
        const startPos = targetPos;
        
        // End: Exploded outwards (Radial)
        // We multiply the normal vector to push it far out
        const explosionDistance = 25.0;
        const endPos = targetPos.clone().add(normalDir.clone().multiplyScalar(explosionDistance));

        // Interpolate position
        group.current.position.lerpVectors(endPos, startPos, mixVal);

        // --- 2. Rotation Logic ---
        
        // When on Tree (mixVal ~ 1): Use pre-calculated spiral rotation (facing out)
        // When Unleashed (mixVal ~ 0): Ideally face the camera, but since tree rotates, 
        // sticking to radial-outward facing usually looks best for explosions.
        // However, we can blend towards "Looking at Camera" for a better effect.
        
        const camPos = state.camera.position;
        const dummy = new THREE.Object3D();
        dummy.position.copy(group.current.position);
        
        // Face camera orientation
        dummy.lookAt(camPos); 
        const faceCamRot = dummy.quaternion;

        // Blend: 1.0 = Spiral Rot, 0.0 = Face Camera
        group.current.quaternion.slerpQuaternions(faceCamRot, targetRot, mixVal);
        
        // --- 3. Scale Logic ---
        // Tree: 0.6 (Small) -> Unleashed: 6.0 (Massive)
        const scale = THREE.MathUtils.lerp(6.0, 0.6, mixVal);
        group.current.scale.setScalar(scale);

        // --- 4. Opacity/Fade Logic ---
        // We want them to fade OUT only at the very end of the explosion.
        // mixVal goes 1.0 -> 0.0
        // We want Opacity 1.0 from 1.0 down to 0.2
        // Then Fade 1.0 -> 0.0 from 0.2 down to 0.0
        
        let opacity = 1.0;
        if (mixVal < 0.2) {
            opacity = mixVal / 0.2; // Linear fade 0.2 -> 0.0
        }
        
        // Apply opacity
        if (paperMat.current) {
            paperMat.current.opacity = opacity;
            paperMat.current.visible = opacity > 0.01;
        }
        if (backMat.current) {
            backMat.current.opacity = opacity;
            backMat.current.visible = opacity > 0.01;
        }
        
        if (imgRef.current && imgRef.current.material) {
             imgRef.current.material.transparent = true;
             imgRef.current.material.opacity = opacity;
             imgRef.current.visible = opacity > 0.01;
        }
    }
  });

  return (
    <group ref={group}>
      {/* Paper Frame - Middle Layer */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.1, 1.4]} />
        <meshStandardMaterial 
            ref={paperMat} 
            color="#fff" 
            emissive="#fff"
            emissiveIntensity={0.2}
            roughness={0.8} 
            transparent 
        />
      </mesh>
      
      {/* Black Backing - Back Layer */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.12, 1.42]} />
        <meshBasicMaterial 
            ref={backMat} 
            color="#111" 
            transparent 
        />
      </mesh>
      
      {/* Image - Front Layer */}
      {/* Z = 0.05 to sit clearly on top of paper */}
      <Image 
        ref={imgRef}
        url={photo.url} 
        scale={[1, 1]} 
        position={[0, 0.1, 0.05]} 
        transparent
        toneMapped={false} 
      />
    </group>
  );
};

export const Polaroids: React.FC<{ photos: PhotoData[], mixVal: number }> = ({ photos, mixVal }) => {
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

    const polaroidData = useMemo(() => {
        return photos.map((_, i) => {
            const count = photos.length;
            const t = i / Math.max(count, 1);
            
            // --- Tree Position (Golden Angle Spiral) ---
            const h = -4 + t * 10; // Height spread (-4 to 6)
            
            // Radius: Ensure it is OUTSIDE the tree foliage
            // Foliage cone roughly (7-h)*0.55. We want larger.
            const r = (9.5 - h) * 0.7; 
            const theta = i * GOLDEN_ANGLE;

            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            
            const targetPos = new THREE.Vector3(x, h, z);

            // --- Normal Vector (Pointing Outward) ---
            // Used for flying out direction
            const normalDir = new THREE.Vector3(x, 0, z).normalize();
            // Add slight Y upward drift for magical feeling
            normalDir.y += 0.2; 
            normalDir.normalize();

            // --- Target Rotation (Face Outward) ---
            const dummyObj = new THREE.Object3D();
            dummyObj.position.copy(targetPos);
            dummyObj.lookAt(0, h, 0); // Look at center (Local Z+ is IN)
            dummyObj.rotateY(Math.PI); // Rotate 180 (Local Z+ is now OUT)
            dummyObj.rotateZ((Math.random() - 0.5) * 0.3); // Random playful tilt
            const targetRot = dummyObj.quaternion.clone();

            return { targetPos, targetRot, normalDir };
        });
    }, [photos]);

    return (
        <>
            {photos.map((photo, i) => (
                <PolaroidItem 
                    key={photo.id} 
                    photo={photo} 
                    index={i} 
                    total={photos.length} 
                    mixVal={mixVal}
                    {...polaroidData[i]}
                />
            ))}
        </>
    )
}
