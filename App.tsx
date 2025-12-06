import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { TreeMorphState } from './types';

const App: React.FC = () => {
  const [morphState, setMorphState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]} // Handle high pixel density screens for sharpness
          gl={{ 
            antialias: false, // Post-processing handles AA usually
            toneMapping: 3, // ACESFilmicToneMapping
            toneMappingExposure: 1.2
          }}
          camera={{ position: [0, 1, 10], fov: 45 }}
        >
          <Suspense fallback={null}>
            <Experience morphState={morphState} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Layer */}
      <Overlay morphState={morphState} setMorphState={setMorphState} />
      
      {/* Loading Overlay from Drei */}
      <Loader 
        containerStyles={{ background: '#01140e' }}
        innerStyles={{ width: '200px', height: '2px', background: '#022b1c' }}
        barStyles={{ background: '#FFD700', height: '2px' }}
        dataStyles={{ fontFamily: 'Playfair Display', color: '#FFD700', fontSize: '12px' }}
      />
    </div>
  );
};

export default App;
