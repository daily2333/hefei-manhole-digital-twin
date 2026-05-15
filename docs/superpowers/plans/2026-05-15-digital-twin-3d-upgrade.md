# Digital Twin 3D Visualization Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前低质量 3D 井盖可视化升级为科幻 HUD 风格数字孪生场景，包含精细模型、后处理管线、科幻城市底图、昼夜切换。

**Architecture:** 迁移到 React Three Fiber + drei + postprocessing，删除死代码，新建 8 个组件文件。

**Tech Stack:** React 18, TypeScript, Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing

**Spec:** `docs/superpowers/specs/2026-05-15-digital-twin-3d-upgrade-design.md`

---

## File Map

### Delete
- `src/components/3d-visualization/ManholeScene.tsx`
- `src/components/3d-visualization/ManholeCover3D.tsx`
- `src/components/3d-visualization/GeoManholeScene.tsx`
- `src/components/3d-visualization/ManholeSceneWrapper.tsx`

### Create
- `src/components/3d-visualization/types.ts`
- `src/components/3d-visualization/SciFiGround.tsx`
- `src/components/3d-visualization/CityBuildings.tsx`
- `src/components/3d-visualization/ManholeModel.tsx`
- `src/components/3d-visualization/StatusIndicator.tsx`
- `src/components/3d-visualization/SceneEffects.tsx`
- `src/components/3d-visualization/HUDOverlay.tsx`
- `src/components/3d-visualization/DigitalTwinScene.tsx`

### Modify
- `package.json` — add postprocessing deps
- `src/components/dashboard/MainContent.tsx` — update import path
- `src/components/prediction/PredictionAnalytics.tsx` — update import path

### Preserve
- `src/components/3d-visualization/HefeiManholeScene.tsx` — keep as fallback

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install postprocessing packages**

```bash
npm install @react-three/postprocessing@^2.16.0 postprocessing@^6.36.0
```

Expected: Packages installed successfully, no peer dependency warnings.

- [ ] **Step 2: Remove unused @amap/amap-react**

```bash
npm uninstall @amap/amap-react
```

Expected: Package removed from package.json.

- [ ] **Step 3: Verify installation**

```bash
node -e "const p = require('./package.json'); console.log('postprocessing:', p.dependencies['@react-three/postprocessing']); console.log('postprocessing-core:', p.dependencies['postprocessing']);"
```

Expected: Both version numbers printed.

---

### Task 2: Create Types File

**Files:**
- Create: `src/components/3d-visualization/types.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export type ManholeStatus = 'normal' | 'warning' | 'alarm' | 'offline';

export interface StatusColors {
  emissive: string;
  emissiveIntensity: number;
  beaconOpacity: number;
}

export const STATUS_CONFIG: Record<ManholeStatus, StatusColors> = {
  normal: { emissive: '#00ff88', emissiveIntensity: 0.3, beaconOpacity: 0.15 },
  warning: { emissive: '#ffaa00', emissiveIntensity: 0.5, beaconOpacity: 0.3 },
  alarm: { emissive: '#ff3333', emissiveIntensity: 0.8, beaconOpacity: 0.5 },
  offline: { emissive: '#666666', emissiveIntensity: 0.0, beaconOpacity: 0.0 },
};

export const NIGHT_COLORS = {
  background: '#0a1525',
  gridLine: '#00ffff',
  gridLineOpacity: 0.3,
  road: '#00ffff',
  roadEmissive: 0.8,
  building: '#00ffff',
  buildingEmissive: 0.6,
  ambientIntensity: 0.15,
  directionalIntensity: 0.0,
};

export const DAY_COLORS = {
  background: '#1a2535',
  gridLine: '#4a8fff',
  gridLineOpacity: 0.2,
  road: '#4a8fff',
  roadEmissive: 0.3,
  building: '#4a8fff',
  buildingEmissive: 0.3,
  ambientIntensity: 0.4,
  directionalIntensity: 1.5,
};

export interface HefeiDistrict {
  name: string;
  center: [number, number];
}

export const HEFEI_DISTRICTS: HefeiDistrict[] = [
  { name: '蜀山区', center: [-8, -6] },
  { name: '庐阳区', center: [6, -6] },
  { name: '包河区', center: [6, 6] },
  { name: '瑶海区', center: [-8, 6] },
  { name: '滨湖新区', center: [12, 10] },
];

export interface RoadPath {
  name: string;
  points: [number, number][];
}

export const ROAD_PATHS: RoadPath[] = [
  {
    name: '长江路',
    points: [[-35, 0], [-15, 0], [0, 0], [15, 0], [35, 0]],
  },
  {
    name: '淮河路',
    points: [[-35, -8], [-15, -8], [0, -8], [15, -8], [35, -8]],
  },
  {
    name: '黄山路',
    points: [[-35, 8], [-15, 8], [0, 8], [15, 8], [35, 8]],
  },
  {
    name: '环城路',
    points: [[-12, -12], [12, -12], [12, 12], [-12, 12], [-12, -12]],
  },
  {
    name: '徽州大道',
    points: [[0, -35], [0, -15], [0, 0], [0, 15], [0, 35]],
  },
  {
    name: '马鞍山路',
    points: [[8, -35], [8, -15], [8, 0], [8, 15], [8, 35]],
  },
];

export interface BuildingOutline {
  name: string;
  points: [number, number][];
  height: number;
  isLandmark: boolean;
}

export const BUILDING_OUTLINES: BuildingOutline[] = [
  {
    name: '合肥市政府',
    points: [[-2, -2], [2, -2], [2, 2], [-2, 2]],
    height: 3,
    isLandmark: true,
  },
  {
    name: '合肥火车站',
    points: [[10, -10], [14, -10], [14, -8], [10, -8]],
    height: 2,
    isLandmark: true,
  },
  {
    name: '滨湖新区',
    points: [[14, 8], [20, 8], [20, 14], [14, 14]],
    height: 4,
    isLandmark: true,
  },
  {
    name: '包河区政府',
    points: [[6, 4], [10, 4], [10, 8], [6, 8]],
    height: 2.5,
    isLandmark: true,
  },
  {
    name: '科学岛',
    points: [[-14, 6], [-10, 6], [-10, 10], [-14, 10]],
    height: 1.5,
    isLandmark: true,
  },
  {
    name: '商业建筑群A',
    points: [[-6, -4], [-3, -4], [-3, -1], [-6, -1]],
    height: 2,
    isLandmark: false,
  },
  {
    name: '商业建筑群B',
    points: [[3, -6], [6, -6], [6, -3], [3, -3]],
    height: 1.8,
    isLandmark: false,
  },
  {
    name: '住宅区A',
    points: [[-10, -8], [-6, -8], [-6, -4], [-10, -4]],
    height: 1.2,
    isLandmark: false,
  },
  {
    name: '住宅区B',
    points: [[12, -4], [16, -4], [16, 0], [12, 0]],
    height: 1.4,
    isLandmark: false,
  },
  {
    name: '工业园',
    points: [[-16, -12], [-10, -12], [-10, -8], [-16, -8]],
    height: 1,
    isLandmark: false,
  },
];
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/types.ts
```

Expected: No errors.

---

### Task 3: Create SciFiGround Component

**Files:**
- Create: `src/components/3d-visualization/SciFiGround.tsx`

- [ ] **Step 1: Write SciFiGround.tsx**

```typescript
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ROAD_PATHS, HEFEI_DISTRICTS, NIGHT_COLORS, DAY_COLORS } from './types';

interface SciFiGroundProps {
  isNightMode: boolean;
}

const GRID_SIZE = 80;
const GRID_DIVISIONS = 40;

const SciFiGround: React.FC<SciFiGroundProps> = React.memo(({ isNightMode }) => {
  const gridRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const colors = isNightMode ? NIGHT_COLORS : DAY_COLORS;

  const gridShader = useMemo(
    () => ({
      uniforms: {
        uColor: { value: new THREE.Color(colors.gridLine) },
        uOpacity: { value: colors.gridLineOpacity },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
          float line = min(grid.x, grid.y);
          float gridAlpha = 1.0 - min(line, 1.0);

          float dist = length(vUv - 0.5) * 2.0;
          float fade = 1.0 - smoothstep(0.3, 1.0, dist);

          float pulse = 0.9 + 0.1 * sin(uTime * 0.5);
          gl_FragColor = vec4(uColor, gridAlpha * uOpacity * fade * pulse);
        }
      `,
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uColor.value.set(colors.gridLine);
      materialRef.current.uniforms.uOpacity.value = colors.gridLineOpacity;
    }
  });

  const roadMeshes = useMemo(() => {
    return ROAD_PATHS.map((road) => {
      const curve = new THREE.CatmullRomCurve3(
        road.points.map(([x, z]) => new THREE.Vector3(x, 0.02, z))
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      return { name: road.name, geometry: tubeGeo };
    });
  }, []);

  return (
    <group ref={gridRef}>
      {/* Grid ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <shaderMaterial
          ref={materialRef}
          args={[gridShader]}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Roads */}
      {roadMeshes.map((road) => (
        <mesh key={road.name} geometry={road.geometry}>
          <meshBasicMaterial
            color={colors.road}
            transparent
            opacity={isNightMode ? 0.6 : 0.3}
          />
        </mesh>
      ))}

      {/* District labels */}
      {HEFEI_DISTRICTS.map((district) => (
        <Text
          key={district.name}
          position={[district.center[0], 0.1, district.center[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.2}
          color={colors.building}
          anchorX="center"
          anchorY="middle"
          fillOpacity={isNightMode ? 0.5 : 0.3}
        >
          {district.name}
        </Text>
      ))}
    </group>
  );
});

SciFiGround.displayName = 'SciFiGround';

export default SciFiGround;
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/SciFiGround.tsx
```

Expected: No errors.

---

### Task 4: Create CityBuildings Component

**Files:**
- Create: `src/components/3d-visualization/CityBuildings.tsx`

- [ ] **Step 1: Write CityBuildings.tsx**

```typescript
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDING_OUTLINES, NIGHT_COLORS, DAY_COLORS } from './types';

interface CityBuildingsProps {
  isNightMode: boolean;
}

const CityBuildings: React.FC<CityBuildingsProps> = React.memo(({ isNightMode }) => {
  const colors = isNightMode ? NIGHT_COLORS : DAY_COLORS;

  const buildingMeshes = useMemo(() => {
    return BUILDING_OUTLINES.map((building) => {
      const basePoints = building.points.map(
        ([x, z]) => new THREE.Vector3(x, 0, z)
      );
      basePoints.push(basePoints[0].clone());

      const baseLineGeo = new THREE.BufferGeometry().setFromPoints(basePoints);

      const verticalLines: THREE.Vector3[][] = [];
      building.points.forEach(([x, z]) => {
        verticalLines.push([
          new THREE.Vector3(x, 0, z),
          new THREE.Vector3(x, building.height, z),
        ]);
      });

      const topPoints = building.points.map(
        ([x, z]) => new THREE.Vector3(x, building.height, z)
      );
      topPoints.push(topPoints[0].clone());
      const topLineGeo = new THREE.BufferGeometry().setFromPoints(topPoints);

      return {
        name: building.name,
        isLandmark: building.isLandmark,
        baseLineGeo,
        topLineGeo,
        verticalLines,
        height: building.height,
      };
    });
  }, []);

  return (
    <group>
      {buildingMeshes.map((building) => (
        <group key={building.name}>
          {/* Base outline */}
          <line geometry={building.baseLineGeo}>
            <lineBasicMaterial
              color={building.isLandmark ? colors.building : '#2a4a6a'}
              transparent
              opacity={building.isLandmark ? (isNightMode ? 0.8 : 0.5) : (isNightMode ? 0.4 : 0.2)}
            />
          </line>

          {/* Top outline */}
          <line geometry={building.topLineGeo}>
            <lineBasicMaterial
              color={building.isLandmark ? colors.building : '#2a4a6a'}
              transparent
              opacity={building.isLandmark ? (isNightMode ? 0.8 : 0.5) : (isNightMode ? 0.4 : 0.2)}
            />
          </line>

          {/* Vertical lines */}
          {building.verticalLines.map((linePoints, idx) => {
            const geo = new THREE.BufferGeometry().setFromPoints(linePoints);
            return (
              <line key={idx} geometry={geo}>
                <lineBasicMaterial
                  color={building.isLandmark ? colors.building : '#2a4a6a'}
                  transparent
                  opacity={building.isLandmark ? (isNightMode ? 0.6 : 0.3) : (isNightMode ? 0.3 : 0.15)}
                />
              </line>
            );
          })}

          {/* Landmark label */}
          {building.isLandmark && (
            <mesh position={[0, building.height + 0.3, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial
                color={colors.building}
                transparent
                opacity={isNightMode ? 0.8 : 0.5}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
});

CityBuildings.displayName = 'CityBuildings';

export default CityBuildings;
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/CityBuildings.tsx
```

Expected: No errors.

---

### Task 5: Create StatusIndicator Component

**Files:**
- Create: `src/components/3d-visualization/StatusIndicator.tsx`

- [ ] **Step 1: Write StatusIndicator.tsx**

```typescript
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
    const beaconRef = useRef<THREE.Mesh>(lightRef.current);
    const config = STATUS_CONFIG[status];

    const lightColor = useMemo(() => new THREE.Color(config.emissive), [config.emissive]);

    useFrame(({ clock }) => {
      if (!lightRef.current) return;

      const mat = lightRef.current.material as THREE.MeshBasicMaterial;
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
        {/* Light sphere */}
        <mesh ref={lightRef}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color={lightColor}
            transparent
            opacity={isNightMode ? 0.8 : 0.5}
          />
        </mesh>

        {/* Beacon column */}
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
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/StatusIndicator.tsx
```

Expected: No errors.

---

### Task 6: Create ManholeModel Component

**Files:**
- Create: `src/components/3d-visualization/ManholeModel.tsx`

- [ ] **Step 1: Write ManholeModel.tsx**

```typescript
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

    const status = (manhole.status || 'normal') as ManholeStatus;
    const config = STATUS_CONFIG[status];

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
      (e: THREE.Event) => {
        e.stopPropagation();
        onSelect(manhole.id);
      },
      [onSelect, manhole.id]
    );

    const handlePointerOver = useCallback(
      (e: THREE.Event) => {
        e.stopPropagation();
        onHover(manhole.id);
      },
      [onHover, manhole.id]
    );

    const handlePointerOut = useCallback(
      (e: THREE.Event) => {
        e.stopPropagation();
        onHover(null);
      },
      [onHover]
    );

    useFrame(({ clock }) => {
      if (!groupRef.current) return;

      // Selected float animation
      if (isSelected) {
        groupRef.current.position.y =
          position[1] + Math.sin(clock.elapsedTime * 2) * 0.05;
      } else {
        groupRef.current.position.y = position[1];
      }

      // Emissive pulse for alarm/warning
      if (coverRef.current) {
        const mat = coverRef.current.material as THREE.MeshStandardMaterial;
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

      // Glow ring pulse
      if (glowRingRef.current) {
        const mat = glowRingRef.current.material as THREE.MeshBasicMaterial;
        if (isSelected) {
          mat.opacity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.2;
        } else {
          mat.opacity = isNightMode ? 0.15 : 0.08;
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
        {/* Cover plate */}
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

        {/* Frame ring */}
        <mesh position={[0, 0.02, 0]}>
          <torusGeometry args={[0.52, 0.03, 8, 32]} />
          <meshStandardMaterial
            color={frameColor}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Bolt holes */}
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

        {/* Shaft (visible when looking from side) */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.2, 32, 1, true]} />
          <meshStandardMaterial
            color={shaftColor}
            metalness={0.7}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ground glow ring */}
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

        {/* Selection highlight ring */}
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

        {/* Status indicator */}
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
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/ManholeModel.tsx
```

Expected: No errors. May have type warnings about ManholeInfo fields — that's acceptable.

---

### Task 7: Create SceneEffects Component

**Files:**
- Create: `src/components/3d-visualization/SceneEffects.tsx`

- [ ] **Step 1: Install dependency check**

Ensure `@react-three/postprocessing` is installed (Task 1).

- [ ] **Step 2: Write SceneEffects.tsx**

```typescript
import React from 'react';
import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

interface SceneEffectsProps {
  isNightMode: boolean;
}

const SceneEffects: React.FC<SceneEffectsProps> = React.memo(({ isNightMode }) => {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        intensity={isNightMode ? 1.5 : 0.5}
        radius={0.4}
      />
      <SSAO
        radius={0.5}
        intensity={0.3}
        luminanceInfluence={0.5}
      />
      <Vignette
        offset={0.3}
        darkness={isNightMode ? 0.7 : 0.3}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
});

SceneEffects.displayName = 'SceneEffects';

export default SceneEffects;
```

- [ ] **Step 3: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/SceneEffects.tsx
```

Expected: No errors.

---

### Task 8: Create HUDOverlay Component

**Files:**
- Create: `src/components/3d-visualization/HUDOverlay.tsx`

- [ ] **Step 1: Write HUDOverlay.tsx**

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { ManholeInfo } from '../../typings';

interface HUDOverlayProps {
  manholes: ManholeInfo[];
  isNightMode: boolean;
  onToggleNightMode: () => void;
}

const HUDOverlay: React.FC<HUDOverlayProps> = React.memo(
  ({ manholes, isNightMode, onToggleNightMode }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => {
      const online = manholes.filter((m) => m.status === 'normal').length;
      const warning = manholes.filter((m) => m.status === 'warning').length;
      const alarm = manholes.filter((m) => m.status === 'alarm').length;
      const offline = manholes.filter((m) => m.status === 'offline').length;
      return { online, warning, alarm, offline };
    }, [manholes]);

    const timeStr = currentTime.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = currentTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: "'JetBrains Mono', 'Consolas', monospace",
    };

    const panelBase: React.CSSProperties = {
      background: isNightMode
        ? 'rgba(10, 21, 37, 0.85)'
        : 'rgba(26, 37, 53, 0.8)',
      border: `1px solid ${isNightMode ? 'rgba(0, 255, 255, 0.3)' : 'rgba(74, 143, 255, 0.3)'}`,
      borderRadius: 4,
      padding: '8px 16px',
      color: isNightMode ? '#00ffff' : '#4a8fff',
      backdropFilter: 'blur(8px)',
    };

    return (
      <div style={overlayStyle}>
        {/* Top-left: Title + Time */}
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <div style={panelBase}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
              合肥智慧井盖数字孪生
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {dateStr} {timeStr}
            </div>
          </div>
        </div>

        {/* Top-right: Stats */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ ...panelBase, display: 'flex', gap: 16, alignItems: 'center' }}>
            <StatItem label="在线" value={stats.online} color="#00ff88" />
            <StatItem label="告警" value={stats.warning + stats.alarm} color="#ffaa00" />
            <StatItem label="离线" value={stats.offline} color="#666666" />
          </div>
        </div>

        {/* Bottom-center: Night mode toggle */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={onToggleNightMode}
            style={{
              ...panelBase,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isNightMode
                ? 'rgba(0, 255, 255, 0.8)'
                : 'rgba(74, 143, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isNightMode
                ? 'rgba(0, 255, 255, 0.3)'
                : 'rgba(74, 143, 255, 0.3)';
            }}
          >
            {isNightMode ? '🌙 夜间模式' : '☀️ 日间模式'}
          </button>
        </div>
      </div>
    );
  }
);

const StatItem: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, opacity: 0.7 }}>{label}</div>
  </div>
);

HUDOverlay.displayName = 'HUDOverlay';

export default HUDOverlay;
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/HUDOverlay.tsx
```

Expected: No errors.

---

### Task 9: Create DigitalTwinScene (Main Scene Component)

**Files:**
- Create: `src/components/3d-visualization/DigitalTwinScene.tsx`

- [ ] **Step 1: Write DigitalTwinScene.tsx**

```typescript
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

const DEFAULT_VIEW = new THREE.Vector3(0, 25, 25);

const CameraController: React.FC<{
  target: THREE.Vector3 | null;
  isAnimating: React.MutableRefObject<boolean>;
}> = ({ target, isAnimating }) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!target) return;
    currentPos.current.lerp(target, 0.03);
    camera.position.copy(currentPos.current);
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cameraTarget = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);

  const manholePositions = useMemo(() => {
    const landmarkPositions: [number, number][] = [
      [-0.5, -0.5],   // near 市政府
      [12.5, -9.5],   // near 火车站
      [16.5, 10.5],   // near 滨湖新区
      [8.5, 6.5],     // near 包河区政府
      [-11.5, 8.5],   // near 科学岛
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
        isAnimating.current = true;
      }
    },
    [manholes, manholePositions, onSelectManhole]
  );

  const handleBackgroundClick = useCallback(() => {
    onSelectManhole?.('');
    cameraTarget.current = DEFAULT_VIEW.clone();
    isAnimating.current = true;
  }, [onSelectManhole]);

  return (
    <>
      {/* Lighting */}
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

      {/* Environment */}
      <Environment preset={isNightMode ? 'night' : 'city'} />

      {/* Camera controller */}
      <CameraController target={cameraTarget.current} isAnimating={isAnimating} />

      {/* Ground + Buildings */}
      <SciFiGround isNightMode={isNightMode} />
      <CityBuildings isNightMode={isNightMode} />

      {/* Manholes */}
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

      {/* Post-processing */}
      <SceneEffects isNightMode={isNightMode} />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
        enablePan={false}
      />

      {/* Background click handler */}
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

  const handleToggleNightMode = useCallback(() => {
    setInternalNightMode((prev) => !prev);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <HUDOverlay
        manholes={manholes}
        isNightMode={isNightMode}
        onToggleNightMode={handleToggleNightMode}
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
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/DigitalTwinScene.tsx
```

Expected: No errors.

---

### Task 10: Rewrite ManholeSceneWrapper

**Files:**
- Modify: `src/components/3d-visualization/ManholeSceneWrapper.tsx` (full rewrite)

- [ ] **Step 1: Read current ManholeSceneWrapper.tsx to understand its props interface**

Read the file at `src/components/3d-visualization/ManholeSceneWrapper.tsx`.

- [ ] **Step 2: Rewrite ManholeSceneWrapper.tsx**

```typescript
import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';

const DigitalTwinScene = lazy(() => import('./DigitalTwinScene'));

interface ManholeSceneWrapperProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}

const LoadingFallback: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a1525',
    }}
  >
    <Spin size="large" tip="加载数字孪生场景..." />
  </div>
);

const ManholeSceneWrapper: React.FC<ManholeSceneWrapperProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  isNightMode,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
      <Suspense fallback={<LoadingFallback />}>
        <DigitalTwinScene
          manholes={manholes}
          realTimeDataMap={realTimeDataMap}
          onSelectManhole={onSelectManhole}
          selectedManholeId={selectedManholeId}
          isNightMode={isNightMode}
        />
      </Suspense>
    </div>
  );
};

export default ManholeSceneWrapper;
```

- [ ] **Step 3: Verify file compiles**

```bash
npx tsc --noEmit src/components/3d-visualization/ManholeSceneWrapper.tsx
```

Expected: No errors.

---

### Task 11: Update Import Paths

**Files:**
- Modify: `src/components/prediction/PredictionAnalytics.tsx:25`

- [ ] **Step 1: Update PredictionAnalytics.tsx import**

Change line 25 from:
```typescript
import HefeiManholeScene from '../3d-visualization/HefeiManholeScene';
```
to:
```typescript
import DigitalTwinScene from '../3d-visualization/DigitalTwinScene';
```

- [ ] **Step 2: Update the JSX usage**

Find the line that uses `<HefeiManholeScene` and change it to `<DigitalTwinScene`. The props interface is compatible — no other changes needed.

- [ ] **Step 3: Verify file compiles**

```bash
npx tsc --noEmit src/components/prediction/PredictionAnalytics.tsx
```

Expected: No errors.

---

### Task 12: Delete Dead Code Files

**Files:**
- Delete: `src/components/3d-visualization/ManholeScene.tsx`
- Delete: `src/components/3d-visualization/ManholeCover3D.tsx`
- Delete: `src/components/3d-visualization/GeoManholeScene.tsx`

- [ ] **Step 1: Verify no imports reference these files**

```bash
grep -r "ManholeScene\b" src/ --include="*.tsx" --include="*.ts" | grep -v "HefeiManholeScene" | grep -v "DigitalTwinScene" | grep -v "ManholeSceneWrapper"
```

Expected: No output (no files import ManholeScene).

```bash
grep -r "ManholeCover3D" src/ --include="*.tsx" --include="*.ts"
```

Expected: No output.

```bash
grep -r "GeoManholeScene" src/ --include="*.tsx" --include="*.ts"
```

Expected: No output.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/3d-visualization/ManholeScene.tsx
rm src/components/3d-visualization/ManholeCover3D.tsx
rm src/components/3d-visualization/GeoManholeScene.tsx
```

- [ ] **Step 3: Verify project compiles**

```bash
npx tsc --noEmit
```

Expected: No errors related to deleted files.

---

### Task 13: Full Build Verification

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm start
```

Expected: App loads, navigate to 3D visualization tab, see:
- Sci-fi grid ground with glowing lines
- Road light strips
- Building outlines
- All 50 manhole models with detailed geometry
- Status indicators with correct colors
- Bloom glow on emissive surfaces
- SSAO depth in crevices
- Night/day toggle button works with smooth transition
- Click on manhole highlights it and flies camera
- HUD overlay shows title, time, stats

---

### Task 14: Final Cleanup and Commit

- [ ] **Step 1: Verify no unused imports remain**

```bash
npx tsc --noEmit 2>&1 | grep "unused"
```

Expected: No unused import warnings.

- [ ] **Step 2: Check for any remaining references to deleted files**

```bash
grep -r "ManholeScene\b\|ManholeCover3D\|GeoManholeScene" src/ --include="*.tsx" --include="*.ts" --include="*.js"
```

Expected: No output.

- [ ] **Step 3: Stage and commit**

```bash
git add -A
git status
```

Review the staged changes, then commit:

```bash
git commit -m "feat: upgrade 3D visualization to sci-fi digital twin

- Migrate from vanilla Three.js to React Three Fiber + drei
- Add postprocessing pipeline (Bloom, SSAO, Vignette, ACES ToneMapping)
- Replace plain cylinder manhole covers with detailed PBR models
- Add sci-fi grid ground with road light strips and building outlines
- Upgrade day/night toggle with smooth 1.5s transition
- Add HUD overlay with title, time, and status stats
- Delete dead code (ManholeScene, ManholeCover3D, GeoManholeScene)
- Remove unused @amap/amap-react dependency"
```
