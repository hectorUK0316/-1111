import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Sparkles, 
  MeshReflectorMaterial
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeMorphState } from '../types';

// Fix: Register R3F elements with JSX to solve "Property does not exist on type JSX.IntrinsicElements"
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: ThreeElements['instancedMesh'];
      coneGeometry: ThreeElements['coneGeometry'];
      meshStandardMaterial: ThreeElements['meshStandardMaterial'];
      meshBasicMaterial: ThreeElements['meshBasicMaterial'];
      boxGeometry: ThreeElements['boxGeometry'];
      sphereGeometry: ThreeElements['sphereGeometry'];
      extrudeGeometry: ThreeElements['extrudeGeometry'];
      octahedronGeometry: ThreeElements['octahedronGeometry'];
      group: ThreeElements['group'];
      mesh: ThreeElements['mesh'];
      icosahedronGeometry: ThreeElements['icosahedronGeometry'];
      pointLight: ThreeElements['pointLight'];
      planeGeometry: ThreeElements['planeGeometry'];
      ambientLight: ThreeElements['ambientLight'];
      spotLight: ThreeElements['spotLight'];
    }
  }
}

// Constants
const GOLD_COLOR = new THREE.Color("#FFD700");
const EMERALD_COLOR = new THREE.Color("#004d25");
const GIFT_COUNT = 700; // Total gifts (150 spheres + 150 cubes)
const BRANCH_COUNT = 1000; // Lush tree
const LIGHT_COUNT = 200; // Twinkling stars on tree

interface ExperienceProps {
  morphState: TreeMorphState;
}

// Helper to generate random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper to interpolate matrices
const tempObj = new THREE.Object3D();
const tempPos = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

// --- COMPONENTS ---

const MorphingBranches: React.FC<{ morphState: TreeMorphState }> = ({ morphState }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const { treeTransforms, scatterTransforms } = useMemo(() => {
        const treeData = [];
        const scatterData = [];
        const count = BRANCH_COUNT;

        for (let i = 0; i < count; i++) {
            // --- Tree Transform ---
            const t = i / count;
            // Use golden angle for natural distribution
            const angle = t * Math.PI * 2 * 30; // More spirals for density
            
            const y = t * 6 - 2.5; 
            
            // Cone shape profile
            const radiusBase = 2.5 * (1 - t);
            const radius = Math.max(0.05, radiusBase + (Math.random() - 0.5) * 0.4);
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Orientation: Point outwards and slightly up
            const pos = new THREE.Vector3(x, y, z);
            const lookAtPos = new THREE.Vector3(x * 2, y + 1, z * 2);
            const rot = new THREE.Quaternion();
            tempObj.position.copy(pos);
            tempObj.lookAt(lookAtPos);
            rot.copy(tempObj.quaternion);

            // Scale
            const s = 0.5 + Math.random() * 0.5;
            const scale = new THREE.Vector3(s, s, s);

            treeData.push({ pos, rot, scale });

            // --- Scatter Transform ---
            scatterData.push({
                pos: randomInSphere(10),
                rot: new THREE.Quaternion().random(),
                scale: scale
            });
        }
        return { treeTransforms: treeData, scatterTransforms: scatterData };
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;
        const targetProgress = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;

        for (let i = 0; i < BRANCH_COUNT; i++) {
            meshRef.current.getMatrixAt(i, tempObj.matrix);
            tempObj.matrix.decompose(tempPos, tempQuat, tempScale);

            const target = targetProgress === 1 ? treeTransforms[i] : scatterTransforms[i];

            tempPos.lerp(target.pos, 0.05);
            tempQuat.slerp(target.rot, 0.05);
            tempScale.lerp(target.scale, 0.05);

            tempObj.position.copy(tempPos);
            tempObj.quaternion.copy(tempQuat);
            tempObj.scale.copy(tempScale);
            tempObj.updateMatrix();

            meshRef.current.setMatrixAt(i, tempObj.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, BRANCH_COUNT]} castShadow receiveShadow>
            <coneGeometry args={[0.08, 0.6, 3]} />{/* Low poly cone for "needle" abstract look */}
            <meshStandardMaterial 
                color={EMERALD_COLOR} 
                roughness={0.7} 
                metalness={0.1} 
            />
        </instancedMesh>
    );
};

const MorphingGifts: React.FC<{ morphState: TreeMorphState }> = ({ morphState }) => {
    const sphereRef = useRef<THREE.InstancedMesh>(null);
    const boxRef = useRef<THREE.InstancedMesh>(null);
  
    // Define a palette of colors for the gifts
    const giftColors = useMemo(() => [
        new THREE.Color("#D42426"), // Festive Red
        new THREE.Color("#FFD700"), // Gold
        new THREE.Color("#C0C0C0"), // Silver
        new THREE.Color("#002366"), // Royal Blue
        new THREE.Color("#800080"), // Purple
        new THREE.Color("#FF007F"), // Magenta
    ], []);

    const { sphereData, boxData } = useMemo(() => {
      const spheres = { transforms: [] as any[], colors: [] as THREE.Color[] };
      const boxes = { transforms: [] as any[], colors: [] as THREE.Color[] };
      
      const count = GIFT_COUNT;
  
      for (let i = 0; i < count; i++) {
          // --- Tree Transform ---
          // Use index to drive spiral height so both shapes are distributed evenly
          const t = i / count;
          const angle = t * Math.PI * 30; 
          
          // Position
          const y = t * 6 - 2.5; 
          
          // Radius: Sit slightly outside the branch tips
          const tRadius = 1 - t;
          const radiusBase = 2.8 * tRadius; // Slightly wider than branches
          const radiusJitter = (Math.random() - 0.5) * 0.5;
          const radius = Math.max(0.1, radiusBase + radiusJitter);
          
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
  
          // Scale - Reduced by 30% from 0.15 -> 0.1
          const scaleBase = 0.12;
          const s = scaleBase + Math.random() * 0.08;
          const sVector = new THREE.Vector3(s, s, s);
  
          // Random rotation
          const rot = new THREE.Quaternion();
          rot.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));

          const treeTransform = { 
              pos: new THREE.Vector3(x, y, z), 
              rot: rot, 
              scale: sVector 
          };
  
          // --- Scatter Transform ---
          const scatterTransform = { 
              pos: randomInSphere(12), 
              rot: new THREE.Quaternion().random(), 
              scale: sVector 
          };

          const color = giftColors[Math.floor(Math.random() * giftColors.length)];

          // Distribute even/odd to Spheres/Boxes for perfect mixing
          if (i % 2 === 0) {
              spheres.transforms.push({ tree: treeTransform, scatter: scatterTransform });
              spheres.colors.push(color);
          } else {
              boxes.transforms.push({ tree: treeTransform, scatter: scatterTransform });
              boxes.colors.push(color);
          }
      }
      return { sphereData: spheres, boxData: boxes };
    }, [giftColors]);

    // Apply colors once
    useEffect(() => {
        if (sphereRef.current) {
            sphereData.colors.forEach((col, i) => sphereRef.current!.setColorAt(i, col));
            sphereRef.current.instanceColor!.needsUpdate = true;
        }
        if (boxRef.current) {
            boxData.colors.forEach((col, i) => boxRef.current!.setColorAt(i, col));
            boxRef.current.instanceColor!.needsUpdate = true;
        }
    }, [sphereData, boxData]);
  
    useFrame((state) => {
      const targetProgress = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;
  
      // Update Spheres
      if (sphereRef.current) {
          for (let i = 0; i < sphereData.transforms.length; i++) {
            sphereRef.current.getMatrixAt(i, tempObj.matrix);
            tempObj.matrix.decompose(tempPos, tempQuat, tempScale);
            const { tree, scatter } = sphereData.transforms[i];
            const target = targetProgress === 1 ? tree : scatter;

            tempPos.lerp(target.pos, 0.04);
            tempQuat.slerp(target.rot, 0.06);
            tempScale.lerp(target.scale, 0.05);

            tempObj.position.copy(tempPos);
            tempObj.quaternion.copy(tempQuat);
            tempObj.scale.copy(tempScale);
            tempObj.updateMatrix();
            sphereRef.current.setMatrixAt(i, tempObj.matrix);
          }
          sphereRef.current.instanceMatrix.needsUpdate = true;
      }

      // Update Boxes
      if (boxRef.current) {
        for (let i = 0; i < boxData.transforms.length; i++) {
          boxRef.current.getMatrixAt(i, tempObj.matrix);
          tempObj.matrix.decompose(tempPos, tempQuat, tempScale);
          const { tree, scatter } = boxData.transforms[i];
          const target = targetProgress === 1 ? tree : scatter;

          tempPos.lerp(target.pos, 0.04);
          tempQuat.slerp(target.rot, 0.06);
          tempScale.lerp(target.scale, 0.05);

          tempObj.position.copy(tempPos);
          tempObj.quaternion.copy(tempQuat);
          tempObj.scale.copy(tempScale);
          tempObj.updateMatrix();
          boxRef.current.setMatrixAt(i, tempObj.matrix);
        }
        boxRef.current.instanceMatrix.needsUpdate = true;
      }
    });
  
    return (
      <group>
          {/* Spheres */}
          <instancedMesh ref={sphereRef} args={[undefined, undefined, sphereData.transforms.length]} castShadow receiveShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial roughness={0.1} metalness={0.9} envMapIntensity={2.0} />
          </instancedMesh>
          
          {/* Cubes (Boxes) */}
          <instancedMesh ref={boxRef} args={[undefined, undefined, boxData.transforms.length]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial roughness={0.1} metalness={0.9} envMapIntensity={2.0} />
          </instancedMesh>
      </group>
    );
};

const MorphingLights: React.FC<{ morphState: TreeMorphState }> = ({ morphState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // High intensity colors to trigger bloom
  const lightColors = useMemo(() => [
      new THREE.Color(2, 1.5, 0.5), // Bright Warm Gold
      new THREE.Color(2, 2, 2),     // Bright White
      new THREE.Color(2, 0.8, 0.8), // Bright Rose
  ], []);

  const { transforms, colors } = useMemo(() => {
      const tData = [];
      const cData = [];
      const count = LIGHT_COUNT;

      for (let i = 0; i < count; i++) {
          const t = i / count;
          const angle = t * Math.PI * 45; // High frequency spiral
          const y = t * 6 - 2.5; 
          
          // Position on tree surface (slightly embedded)
          const radiusBase = 2.4 * (1 - t); 
          const radius = Math.max(0.1, radiusBase + (Math.random() - 0.5) * 0.2);
          
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // Tree Transform
          const treePos = new THREE.Vector3(x, y, z);
          
          // Scatter Transform
          const scatterPos = randomInSphere(11);

          // Random Scale Base
          const s = 0.06 + Math.random() * 0.04;
          const scale = new THREE.Vector3(s, s, s);

          tData.push({
              tree: { pos: treePos, scale },
              scatter: { pos: scatterPos, scale }
          });
          
          cData.push(lightColors[Math.floor(Math.random() * lightColors.length)]);
      }
      return { transforms: tData, colors: cData };
  }, [lightColors]);

  // Set colors initially
  useEffect(() => {
      if (meshRef.current) {
          colors.forEach((col, i) => meshRef.current!.setColorAt(i, col));
          meshRef.current.instanceColor!.needsUpdate = true;
      }
  }, [colors]);

  useFrame((state) => {
      if (!meshRef.current) return;
      const targetProgress = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < LIGHT_COUNT; i++) {
          meshRef.current.getMatrixAt(i, tempObj.matrix);
          tempObj.matrix.decompose(tempPos, tempQuat, tempScale);

          const { tree, scatter } = transforms[i];
          const target = targetProgress === 1 ? tree : scatter;

          // Position Lerp
          tempPos.lerp(target.pos, 0.05);
          
          // Twinkle Animation (Scale modulation)
          // Each light has a unique phase offset based on index 'i'
          const twinkle = 0.8 + Math.sin(time * 3 + i * 10) * 0.4;
          const targetScale = target.scale.clone().multiplyScalar(twinkle);
          tempScale.lerp(targetScale, 0.1);

          tempObj.position.copy(tempPos);
          tempObj.scale.copy(tempScale);
          // Lights always face camera ideally, but Octahedron looks good from all angles
          tempObj.rotation.set(time * 0.5, time * 0.3, 0); 
          
          tempObj.updateMatrix();
          meshRef.current.setMatrixAt(i, tempObj.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, LIGHT_COUNT]}>
          <octahedronGeometry args={[1, 0]} /> {/* Diamond/Star shape */}
          <meshBasicMaterial 
              toneMapped={false} // Crucial for bloom
              color={new THREE.Color(1,1,1)} // Instance color overrides this
          />
      </instancedMesh>
  );
};

const StarShapeGeometry: React.FC = () => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const points = 5;
        const outerRadius = 0.8;
        const innerRadius = 0.38;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) s.moveTo(x, y);
            else s.lineTo(x, y);
        }
        s.closePath();
        return s;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelSegments: 2
    }), []);

    return <extrudeGeometry args={[shape, extrudeSettings]} />;
}

const MorphingStar: React.FC<{ morphState: TreeMorphState }> = ({ morphState }) => {
    const ref = useRef<THREE.Group>(null);
    // Tree top is at y = 3.5. Position star slightly above at 3.6 to sit on top.
    const targetPos = useMemo(() => new THREE.Vector3(0, 3.6, 0), []);
    const scatterPos = useMemo(() => new THREE.Vector3(5, 8, -5), []);

    useFrame((state) => {
        if (!ref.current) return;
        
        // Rotate star
        ref.current.rotation.y = state.clock.elapsedTime * 0.5;
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;

        // Position Morph
        const target = morphState === TreeMorphState.TREE_SHAPE ? targetPos : scatterPos;
        ref.current.position.lerp(target, 0.04);
        
        // Scale wobble (Scaled down by 20% -> * 0.8)
        const wobble = (1 + Math.sin(state.clock.elapsedTime * 3) * 0.05) * 0.8;
        ref.current.scale.setScalar(wobble);
    });

    return (
        <group ref={ref}>
             <mesh castShadow>
                <StarShapeGeometry />
                <meshStandardMaterial 
                color={GOLD_COLOR}
                emissive={GOLD_COLOR}
                emissiveIntensity={2} 
                toneMapped={false}
                roughness={0.1}
                metalness={1}
                />
            </mesh>
            <pointLight color="#ffaa00" intensity={3} distance={10} decay={2} />
        </group>
    )
}

const Floor: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
    <planeGeometry args={[50, 50]} />
    <MeshReflectorMaterial
      blur={[300, 100]}
      resolution={1024}
      mixBlur={1}
      mixStrength={40}
      roughness={1}
      depthScale={1.2}
      minDepthThreshold={0.4}
      maxDepthThreshold={1.4}
      color="#001a10"
      metalness={0.5}
      mirror={1}
    />
  </mesh>
);

export const Experience: React.FC<ExperienceProps> = ({ morphState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1, 10]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={15}
        autoRotate={morphState === TreeMorphState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} color="#001100" />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={2} 
        color="#fffaed" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#FFD700" />
      
      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* The Morphing Tree Components */}
      <group position={[0, -0.5, 0]}>
         <MorphingBranches morphState={morphState} />
         <MorphingGifts morphState={morphState} />
         <MorphingLights morphState={morphState} />
         <MorphingStar morphState={morphState} />
      </group>

      <Floor />
      
      {/* Enhanced Sparkles for magical feel - background dust */}
      <Sparkles 
        count={200} 
        scale={12} 
        size={3} 
        speed={0.2} 
        opacity={0.5} 
        color="#FFD700" 
      />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.5} // Lower threshold to pick up the new lights
            mipmapBlur 
            intensity={2.2} // Higher intensity for cinematic glow
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};