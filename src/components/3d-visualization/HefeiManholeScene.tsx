import React, { memo, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, OrbitControls, PerspectiveCamera, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ManholeInfo, ManholeRealTimeData, ManholeStatus } from '../../typings';

interface HefeiManholeSceneProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}

type ScenePoint = {
  manhole: ManholeInfo;
  position: [number, number, number];
  heat: number;
  isCritical: boolean;
};

const statusColorMap: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: '#2dd4bf',
  [ManholeStatus.Warning]: '#f59e0b',
  [ManholeStatus.Alarm]: '#fb7185',
  [ManholeStatus.Maintenance]: '#60a5fa',
  [ManholeStatus.Offline]: '#94a3b8'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizePoints = (manholes: ManholeInfo[], realTimeDataMap: Map<string, ManholeRealTimeData>): ScenePoint[] => {
  const valid = manholes.filter((item) => Number.isFinite(Number(item.location.longitude)) && Number.isFinite(Number(item.location.latitude)));
  if (valid.length === 0) {
    return [];
  }

  const lngValues = valid.map((item) => Number(item.location.longitude));
  const latValues = valid.map((item) => Number(item.location.latitude));
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const latSpan = Math.max(maxLat - minLat, 0.01);

  return valid.slice(0, 80).map((manhole, index) => {
    const data = realTimeDataMap.get(manhole.id) || manhole.latestData;
    const x = ((Number(manhole.location.longitude) - minLng) / lngSpan - 0.5) * 26;
    const z = ((Number(manhole.location.latitude) - minLat) / latSpan - 0.5) * 18;
    const radialOffset = Math.sin(index * 1.7) * 0.4;

    return {
      manhole,
      position: [x + radialOffset, 0, z],
      heat: clamp((data?.waterLevel || 0) / 100, 0.15, 1),
      isCritical: manhole.status === ManholeStatus.Alarm || manhole.status === ManholeStatus.Warning
    };
  });
};

const CityFabric: React.FC<{ nightMode: boolean }> = ({ nightMode }) => {
  const towers = useMemo(() => {
    return Array.from({ length: 22 }, (_, index) => {
      const row = Math.floor(index / 6);
      const col = index % 6;
      const height = 0.8 + ((index * 17) % 5) * 0.7;
      return {
        key: `tower-${index}`,
        position: [-12 + col * 4.2, height / 2, -8 + row * 4.8] as [number, number, number],
        scale: [1.2, height, 1.2] as [number, number, number]
      };
    });
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color={nightMode ? '#071424' : '#dbeafe'} roughness={0.95} metalness={0.1} />
      </mesh>
      <gridHelper args={[34, 28, '#3b82f6', '#0f766e']} position={[0, 0.02, 0]} />
      {towers.map((tower) => (
        <mesh key={tower.key} position={tower.position} castShadow>
          <boxGeometry args={tower.scale} />
          <meshStandardMaterial
            color={nightMode ? '#10233d' : '#cbd5e1'}
            emissive={nightMode ? '#60a5fa' : '#93c5fd'}
            emissiveIntensity={nightMode ? 0.12 : 0.04}
            roughness={0.45}
            metalness={0.55}
          />
        </mesh>
      ))}
      <Line
        points={[[-14, 0.03, -6], [-6, 0.03, -2], [0, 0.03, 1], [8, 0.03, 3], [14, 0.03, 5]]}
        color="#38bdf8"
        lineWidth={1}
        transparent
        opacity={0.42}
      />
      <Line
        points={[[-12, 0.03, 6], [-4, 0.03, 3], [5, 0.03, 0], [12, 0.03, -4]]}
        color="#22c55e"
        lineWidth={1}
        transparent
        opacity={0.3}
      />
    </group>
  );
};

const ManholeNode: React.FC<{
  point: ScenePoint;
  selected: boolean;
  onSelect?: (manholeId: string) => void;
}> = ({ point, selected, onSelect }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const color = statusColorMap[point.manhole.status];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      const scale = selected ? 1.18 + Math.sin(t * 2.5) * 0.06 : 0.96 + Math.sin(t * 1.6 + point.position[0]) * 0.04;
      ringRef.current.scale.setScalar(scale);
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = selected ? 1.35 : 0.55 + point.heat * 0.55;
    }

    if (beamRef.current) {
      beamRef.current.scale.y = 0.85 + Math.sin(t * 2 + point.position[2]) * 0.08 + point.heat * 0.55;
      beamRef.current.position.y = 0.8 + beamRef.current.scale.y * 0.45;
    }
  });

  return (
    <group position={point.position} onClick={() => onSelect?.(point.manhole.id)}>
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.65, 0.72, 0.14, 40]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.08, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <torusGeometry args={[selected ? 1.18 : 0.92, 0.07, 20, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} metalness={0.65} roughness={0.18} />
      </mesh>
      <mesh ref={beamRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.22, 1.6, 24, 1, true]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.3} transparent opacity={selected ? 0.5 : 0.24} />
      </mesh>
      <Sparkles count={selected ? 16 : point.isCritical ? 10 : 6} size={selected ? 5 : 3} scale={[1.8, 1.4, 1.8]} position={[0, 1.2, 0]} speed={selected ? 0.9 : 0.45} color={color} />
      {(selected || point.isCritical) && (
        <Html position={[0, 2.25, 0]} center distanceFactor={14}>
          <div className={`scene-node-label ${selected ? 'selected' : ''}`}>
            <strong>{point.manhole.name}</strong>
            <span>{point.manhole.location.district || '监测点'}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

const CommandScene: React.FC<{
  points: ScenePoint[];
  selectedManholeId?: string;
  onSelectManhole?: (manholeId: string) => void;
  isNightMode: boolean;
}> = ({ points, selectedManholeId, onSelectManhole, isNightMode }) => (
  <Canvas shadows dpr={[1, 2]}>
    <color attach="background" args={[isNightMode ? '#020617' : '#e0f2fe']} />
    <fog attach="fog" args={[isNightMode ? '#020617' : '#e0f2fe', 18, 38]} />
    <PerspectiveCamera makeDefault position={[12, 11, 12]} fov={42} />
    <ambientLight intensity={0.8} color={isNightMode ? '#93c5fd' : '#ffffff'} />
    <directionalLight position={[10, 12, 8]} intensity={1.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <pointLight position={[-8, 6, -6]} intensity={1.1} color="#38bdf8" />
    <pointLight position={[8, 5, 8]} intensity={0.8} color="#22c55e" />
    <Stars radius={80} depth={30} count={isNightMode ? 1800 : 250} factor={3} saturation={0} fade speed={0.6} />
    <Sparkles count={120} scale={[30, 10, 24]} size={1.8} speed={0.25} color={isNightMode ? '#38bdf8' : '#7dd3fc'} />
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
      <group>
        <CityFabric nightMode={isNightMode} />
        {points.map((point) => (
          <ManholeNode
            key={point.manhole.id}
            point={point}
            selected={point.manhole.id === selectedManholeId}
            onSelect={onSelectManhole}
          />
        ))}
      </group>
    </Float>
    <OrbitControls
      enablePan={false}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={10}
      maxDistance={28}
      autoRotate
      autoRotateSpeed={selectedManholeId ? 0.18 : 0.36}
    />
  </Canvas>
);

const HefeiManholeScene: React.FC<HefeiManholeSceneProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  isNightMode = true
}) => {
  const points = useMemo(() => normalizePoints(manholes, realTimeDataMap), [manholes, realTimeDataMap]);
  const selected = useMemo(() => manholes.find((item) => item.id === selectedManholeId) || null, [manholes, selectedManholeId]);

  return (
    <div className="scene-shell">
      <CommandScene
        points={points}
        selectedManholeId={selectedManholeId}
        onSelectManhole={onSelectManhole}
        isNightMode={isNightMode}
      />
      <div className="scene-topline">
        <div>
          <div className="panel-eyebrow">Urban Twin Stage</div>
          <h3>井盖网络实时空间剧场</h3>
        </div>
        <div className="scene-pill-group">
          <span>多点联动</span>
          <span>风险热区</span>
          <span>轨道镜头</span>
        </div>
      </div>
      <div className="scene-bottom-panel">
        {selected ? (
          <>
            <div className="scene-selected-name">{selected.name}</div>
            <div className="scene-selected-meta">
              <span>{selected.location.district || '监测区域'}</span>
              <span>{selected.deviceId}</span>
              <span>{selected.sensorTypes.join(' / ')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="scene-selected-name">拖拽视角或点击井盖节点</div>
            <div className="scene-selected-meta">
              <span>场景已接入 {points.length} 个空间节点</span>
              <span>自动巡航视角已启用</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(HefeiManholeScene);
