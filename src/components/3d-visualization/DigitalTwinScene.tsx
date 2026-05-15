import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';
import SciFiGround from './SciFiGround';
import CityBuildings from './CityBuildings';
import ManholeModel from './ManholeModel';
import SceneEffects from './SceneEffects';
import HUDOverlay from './HUDOverlay';

interface DigitalTwinSceneProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 25, 25);

const CameraController: React.FC<{
  targetPosition: React.MutableRefObject<THREE.Vector3 | null>;
}> = ({ targetPosition }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (!targetPosition.current) return;
    camera.position.lerp(targetPosition.current, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const SceneContent: React.FC<{
  manholes: ManholeInfo[];
  selectedManholeId?: string;
  isNightMode: boolean;
  onSelectManhole?: (manholeId: string) => void;
}> = ({ manholes, selectedManholeId, isNightMode, onSelectManhole }) => {
  const [, setHoveredId] = useState<string | null>(null);
  const cameraTarget = useRef<THREE.Vector3 | null>(null);

  const manholePositions = useMemo(() => {
    const landmarkPositions: [number, number][] = [
      [-0.5, -0.5],
      [12.5, -9.5],
      [16.5, 10.5],
      [8.5, 6.5],
      [-11.5, 8.5],
    ];

    return manholes.map((m, i) => {
      if (i < 5) {
        const [lx, lz] = landmarkPositions[i];
        return [lx, 0, lz] as [number, number, number];
      }
      const hash = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const angle = (hash % 360) * (Math.PI / 180);
      const radius = 5 + (hash % 15);
      return [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ] as [number, number, number];
    });
  }, [manholes]);

  const handleSelect = useCallback(
    (manholeId: string) => {
      onSelectManhole?.(manholeId);
      const idx = manholes.findIndex((m) => m.id === manholeId);
      if (idx >= 0) {
        const [x, , z] = manholePositions[idx];
        cameraTarget.current = new THREE.Vector3(x + 3, 5, z + 3);
      }
    },
    [manholes, manholePositions, onSelectManhole]
  );

  const handleBackgroundClick = useCallback(() => {
    onSelectManhole?.('');
    cameraTarget.current = DEFAULT_CAMERA_POS.clone();
  }, [onSelectManhole]);

  return (
    <>
      <ambientLight intensity={isNightMode ? 0.15 : 0.4} />
      {!isNightMode && (
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      )}

      <Environment preset={isNightMode ? 'night' : 'city'} />

      <CameraController targetPosition={cameraTarget} />

      <SciFiGround isNightMode={isNightMode} />
      <CityBuildings isNightMode={isNightMode} />

      {manholes.map((manhole, i) => (
        <ManholeModel
          key={manhole.id}
          manhole={manhole}
          position={manholePositions[i]}
          isSelected={selectedManholeId === manhole.id}
          isNightMode={isNightMode}
          onSelect={handleSelect}
          onHover={setHoveredId}
        />
      ))}

      <SceneEffects isNightMode={isNightMode} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
        enablePan={false}
      />

      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
};

const DigitalTwinScene: React.FC<DigitalTwinSceneProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  isNightMode: controlledNightMode,
}) => {
  const [internalNightMode, setInternalNightMode] = useState(true);
  const isNightMode = controlledNightMode ?? internalNightMode;

  const selectedManhole = useMemo(
    () => manholes.find((m) => m.id === selectedManholeId) || null,
    [manholes, selectedManholeId]
  );

  const handleToggleNightMode = useCallback(() => {
    setInternalNightMode((prev) => !prev);
  }, []);

  const handleCloseDetail = useCallback(() => {
    onSelectManhole?.('');
  }, [onSelectManhole]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <HUDOverlay
        manholes={manholes}
        isNightMode={isNightMode}
        onToggleNightMode={handleToggleNightMode}
        selectedManhole={selectedManhole}
        realTimeDataMap={realTimeDataMap}
        onCloseDetail={handleCloseDetail}
      />
      <Canvas
        shadows
        camera={{ position: [0, 25, 25], fov: 60, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ background: isNightMode ? '#0a1525' : '#1a2535' }}
      >
        <Suspense fallback={null}>
          <SceneContent
            manholes={manholes}
            selectedManholeId={selectedManholeId}
            isNightMode={isNightMode}
            onSelectManhole={onSelectManhole}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default DigitalTwinScene;
