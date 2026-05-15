import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATUS_CONFIG, ManholeStatus } from './types';

interface StatusIndicatorProps {
  status: ManholeStatus;
  isNightMode: boolean;
  isSelected: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(
  ({ status, isNightMode, isSelected }) => {
    const lightRef = useRef<THREE.Mesh>(null);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.normal;

    const lightColor = useMemo(() => new THREE.Color(config.emissive), [config.emissive]);

    useFrame(({ clock }) => {
      if (!lightRef.current || !lightRef.current.material) return;

      const mat = lightRef.current.material as THREE.MeshBasicMaterial;
      if (mat.opacity === undefined) return;

      if (status === 'alarm') {
        mat.opacity = 0.6 + Math.sin(clock.elapsedTime * 4) * 0.4;
      } else if (status === 'warning') {
        mat.opacity = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.2;
      } else if (isSelected) {
        mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 3) * 0.3;
      } else {
        mat.opacity = isNightMode ? 0.8 : 0.5;
      }
    });

    if (status === 'offline') return null;

    return (
      <group position={[0, 0.35, 0]}>
        <mesh ref={lightRef}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color={lightColor}
            transparent
            opacity={isNightMode ? 0.8 : 0.5}
          />
        </mesh>

        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.02, 0.15, 1.5, 8, 1, true]} />
          <meshBasicMaterial
            color={lightColor}
            transparent
            opacity={config.beaconOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export default StatusIndicator;
