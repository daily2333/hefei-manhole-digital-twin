import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SceneEffectsProps {
  isNightMode: boolean;
}

const SceneEffects: React.FC<SceneEffectsProps> = ({ isNightMode }) => {
  const { scene } = useThree();
  const prevNightMode = useRef(isNightMode);

  useFrame(() => {
    if (prevNightMode.current !== isNightMode) {
      scene.background = new THREE.Color(isNightMode ? '#0a1525' : '#1a2535');
      prevNightMode.current = isNightMode;
    }
  });

  return null;
};

SceneEffects.displayName = 'SceneEffects';

export default SceneEffects;
