import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ManholeInfo } from '../../typings';
import { STATUS_CONFIG, ManholeStatus } from './types';
import StatusIndicator from './StatusIndicator';

interface ManholeModelProps {
  manhole: ManholeInfo;
  position: [number, number, number];
  isSelected: boolean;
  isNightMode: boolean;
  onSelect: (manholeId: string) => void;
  onHover: (manholeId: string | null) => void;
}

const ManholeModel: React.FC<ManholeModelProps> = React.memo(
  ({ manhole, position, isSelected, isNightMode, onSelect, onHover }) => {
    const groupRef = useRef<THREE.Group>(null);
    const coverRef = useRef<THREE.Mesh>(null);
    const glowRingRef = useRef<THREE.Mesh>(null);

    const status = (manhole.status || 'normal') as unknown as ManholeStatus;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.normal;

    const statusColor = useMemo(() => new THREE.Color(config.emissive), [config.emissive]);
    const coverColor = useMemo(() => new THREE.Color('#2a2a2a'), []);
    const frameColor = useMemo(() => new THREE.Color('#3a3a3a'), []);
    const shaftColor = useMemo(() => new THREE.Color('#1a1a1a'), []);

    const boltPositions = useMemo(() => {
      const positions: [number, number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        positions.push([Math.cos(angle) * 0.38, 0.04, Math.sin(angle) * 0.38]);
      }
      return positions;
    }, []);

    const handleClick = useCallback(
      (e: any) => {
        e.stopPropagation();
        onSelect(manhole.id);
      },
      [onSelect, manhole.id]
    );

    const handlePointerOver = useCallback(
      (e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(manhole.id);
      },
      [onHover, manhole.id]
    );

    const handlePointerOut = useCallback(
      (e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
        onHover(null);
      },
      [onHover]
    );

    useFrame(({ clock }) => {
      if (!groupRef.current) return;

      if (isSelected) {
        groupRef.current.position.y =
          position[1] + Math.sin(clock.elapsedTime * 2) * 0.05;
      } else {
        groupRef.current.position.y = position[1];
      }

      if (coverRef.current && coverRef.current.material) {
        const mat = coverRef.current.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== undefined) {
          if (status === 'alarm') {
            mat.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
          } else if (status === 'warning') {
            mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 2) * 0.15;
          } else if (isSelected) {
            mat.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.2;
          } else {
            mat.emissiveIntensity = config.emissiveIntensity;
          }
        }
      }

      if (glowRingRef.current && glowRingRef.current.material) {
        const mat = glowRingRef.current.material as THREE.MeshBasicMaterial;
        if (mat.opacity !== undefined) {
          if (isSelected) {
            mat.opacity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.2;
          } else {
            mat.opacity = isNightMode ? 0.15 : 0.08;
          }
        }
      }
    });

    return (
      <group
        ref={groupRef}
        position={position}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <mesh ref={coverRef} position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
          <meshStandardMaterial
            color={coverColor}
            metalness={0.85}
            roughness={0.25}
            emissive={statusColor}
            emissiveIntensity={config.emissiveIntensity}
          />
        </mesh>

        <mesh position={[0, 0.02, 0]}>
          <torusGeometry args={[0.52, 0.03, 8, 32]} />
          <meshStandardMaterial
            color={frameColor}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {boltPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
            <meshStandardMaterial
              color={shaftColor}
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>
        ))}

        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.2, 32, 1, true]} />
          <meshStandardMaterial
            color={shaftColor}
            metalness={0.7}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh
          ref={glowRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
        >
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={isNightMode ? 0.15 : 0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {isSelected && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0.75, 0.85, 32]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        <StatusIndicator
          status={status}
          isNightMode={isNightMode}
          isSelected={isSelected}
        />
      </group>
    );
  }
);

ManholeModel.displayName = 'ManholeModel';

export default ManholeModel;
