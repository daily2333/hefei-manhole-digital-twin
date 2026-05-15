import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDING_OUTLINES, NIGHT_COLORS, DAY_COLORS } from './types';

interface CityBuildingsProps {
  isNightMode: boolean;
}

const CityBuildings: React.FC<CityBuildingsProps> = React.memo(({ isNightMode }) => {
  const colors = isNightMode ? NIGHT_COLORS : DAY_COLORS;

  const buildingData = useMemo(() => {
    return BUILDING_OUTLINES.map((building) => {
      const basePoints = building.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
      basePoints.push(basePoints[0].clone());
      const baseLineGeo = new THREE.BufferGeometry().setFromPoints(basePoints);

      const topPoints = building.points.map(([x, z]) => new THREE.Vector3(x, building.height, z));
      topPoints.push(topPoints[0].clone());
      const topLineGeo = new THREE.BufferGeometry().setFromPoints(topPoints);

      const verticalGeos = building.points.map(([x, z]) => {
        const pts = [new THREE.Vector3(x, 0, z), new THREE.Vector3(x, building.height, z)];
        return new THREE.BufferGeometry().setFromPoints(pts);
      });

      return {
        name: building.name,
        isLandmark: building.isLandmark,
        baseLineGeo,
        topLineGeo,
        verticalGeos,
        height: building.height,
      };
    });
  }, []);

  const lineObjects = useMemo(() => {
    return buildingData.map((building) => {
      const mainColor = building.isLandmark ? colors.building : '#2a4a6a';
      const mainOpacity = building.isLandmark
        ? isNightMode ? 0.8 : 0.5
        : isNightMode ? 0.4 : 0.2;
      const vertOpacity = building.isLandmark
        ? isNightMode ? 0.6 : 0.3
        : isNightMode ? 0.3 : 0.15;

      const baseMat = new THREE.LineBasicMaterial({ color: mainColor, transparent: true, opacity: mainOpacity });
      const topMat = new THREE.LineBasicMaterial({ color: mainColor, transparent: true, opacity: mainOpacity });
      const vertMat = new THREE.LineBasicMaterial({ color: mainColor, transparent: true, opacity: vertOpacity });

      return {
        name: building.name,
        isLandmark: building.isLandmark,
        height: building.height,
        baseLine: new THREE.Line(building.baseLineGeo, baseMat),
        topLine: new THREE.Line(building.topLineGeo, topMat),
        verticalLines: building.verticalGeos.map((geo) => new THREE.Line(geo, vertMat)),
      };
    });
  }, [buildingData, colors.building, isNightMode]);

  return (
    <group>
      {lineObjects.map((building) => (
        <group key={building.name}>
          <primitive object={building.baseLine} />
          <primitive object={building.topLine} />
          {building.verticalLines.map((lineObj, idx) => (
            <primitive key={idx} object={lineObj} />
          ))}
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
