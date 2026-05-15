import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ROAD_PATHS, HEFEI_DISTRICTS, NIGHT_COLORS, DAY_COLORS } from './types';

interface SciFiGroundProps {
  isNightMode: boolean;
}

const SciFiGround: React.FC<SciFiGroundProps> = React.memo(({ isNightMode }) => {
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
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <shaderMaterial
          ref={materialRef}
          args={[gridShader]}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {roadMeshes.map((road) => (
        <mesh key={road.name} geometry={road.geometry}>
          <meshBasicMaterial
            color={colors.road}
            transparent
            opacity={isNightMode ? 0.6 : 0.3}
          />
        </mesh>
      ))}

      {HEFEI_DISTRICTS.map((district) => (
        <Html
          key={district.name}
          position={[district.center[0], 0.1, district.center[1]]}
          transform
          rotation={[-Math.PI / 2, 0, 0]}
          style={{
            color: colors.building,
            fontSize: '14px',
            fontFamily: 'sans-serif',
            opacity: isNightMode ? 0.5 : 0.3,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          center
        >
          {district.name}
        </Html>
      ))}
    </group>
  );
});

SciFiGround.displayName = 'SciFiGround';

export default SciFiGround;
