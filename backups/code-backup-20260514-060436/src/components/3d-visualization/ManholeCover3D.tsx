import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { ManholeInfo, ManholeStatus, CoverStatus, ManholeRealTimeData } from '../../typings';
import * as THREE from 'three';

// 创建共享的几何体常量，避免每个组件实例重复创建
const SHARED_GEOMETRIES = {
  lowDetail: {
    shaft: new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8, 1, true),
    bottom: new THREE.CircleGeometry(0.5, 8),
    cover: new THREE.CylinderGeometry(0.52, 0.52, 0.05, 8, 1, false),
    ring: new THREE.TorusGeometry(0.45, 0.05, 8, 16),
    glow: new THREE.CylinderGeometry(0.55, 0.55, 0.6, 8, 1, true),
    water: new THREE.CircleGeometry(0.48, 8)
  }
};

// 组件引用计数
let instanceCounter = 0;

interface ManholeCover3DProps {
  info: ManholeInfo;
  coverStatus: CoverStatus;
  selected: boolean;
  position?: number[] | THREE.Vector3;
  onClick?: () => void;
}

/**
 * 井盖的3D模型组件 - 性能优化版
 */
const ManholeCover3D: React.FC<ManholeCover3DProps> = ({ 
  info, 
  coverStatus, 
  selected, 
  position = [0, 0, 0],
  onClick 
}) => {
  // 组件实例计数
  useEffect(() => {
    instanceCounter++;
    return () => {
      instanceCounter--;
    };
  }, []);
  
  const groupRef = useRef<THREE.Group>(null);
  const coverRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const statusLightRef = useRef<THREE.PointLight>(null);
  const idTextRef = useRef<THREE.Sprite>(null);
  const statusTextRef = useRef<THREE.Sprite>(null);
  
  // 缓存当前状态以避免不必要的材质更新
  const [currentStatus, setCurrentStatus] = useState<ManholeStatus>(info.status);
  const [currentCoverStatus, setCurrentCoverStatus] = useState<CoverStatus>(coverStatus);
  
  // 当状态变化时更新
  useEffect(() => {
    if (currentStatus !== info.status) {
      setCurrentStatus(info.status);
    }
    if (currentCoverStatus !== coverStatus) {
      setCurrentCoverStatus(coverStatus);
    }
  }, [info.status, currentStatus, coverStatus, currentCoverStatus]);
  
  // 处理位置信息
  const positionVector = useMemo(() => {
    if (position instanceof THREE.Vector3) {
      return position;
    } else {
      return new THREE.Vector3(position[0], position[1], position[2]);
    }
  }, [position]);

  // 根据井盖状态获取颜色 - 使用useMemo避免不必要的重新计算
  const statusColor = useMemo(() => {
    switch (info.status) {
      case ManholeStatus.Normal:
        return new THREE.Color(0x52c41a); // 绿色
      case ManholeStatus.Warning:
        return new THREE.Color(0xfaad14); // 黄色
      case ManholeStatus.Alarm:
        return new THREE.Color(0xf5222d); // 红色
      case ManholeStatus.Maintenance:
        return new THREE.Color(0x1890ff); // 蓝色
      case ManholeStatus.Offline:
        return new THREE.Color(0x8c8c8c); // 灰色
      default:
        return new THREE.Color(0x52c41a); // 默认绿色
    }
  }, [info.status]);

  // 材质定义 - 使用useMemo避免在重渲染时重新创建材质
  const materials = useMemo(() => {
    // 创建共享的材质特性
    const commonProperties = {
      envMapIntensity: 0.5, // 降低环境贴图强度以提高性能
      flatShading: true,    // 使用平面着色减少计算
    };

    return {
      // 井筒材质 - 使用金属质感
      shaftMaterial: new THREE.MeshStandardMaterial({ 
        color: '#555555', 
        roughness: 0.4, 
        metalness: 0.7,
        ...commonProperties,
      }),
      
      // 井底材质
      bottomMaterial: new THREE.MeshStandardMaterial({ 
        color: '#333333', 
        roughness: 0.8, 
        metalness: 0.2,
        ...commonProperties,
      }),
      
      // 井盖材质 - 金属质感
      coverMaterial: new THREE.MeshStandardMaterial({ 
        color: '#505050', 
        roughness: 0.2, 
        metalness: 0.9,
        ...commonProperties,
      }),
      
      // 井盖花纹材质
      patternMaterial: new THREE.MeshStandardMaterial({ 
        color: '#444444', 
        roughness: 0.5, 
        metalness: 0.8,
        ...commonProperties,
      }),
      
      // 发光体材质 - 使用基础材质避免光照计算
      glowMaterial: new THREE.MeshBasicMaterial({ 
        color: statusColor, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.BackSide,
        depthWrite: false,
      }),
      
      // 水面材质 - 使用标准材质替代物理材质以提高性能
      waterMaterial: new THREE.MeshStandardMaterial({
        color: '#3a7ca5',
        roughness: 0.1, 
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        ...commonProperties,
      }),
    };
  }, [statusColor]);
  
  // 创建文本精灵 - 使用useMemo避免重复创建
  const createTextSprite = useCallback((text: string, size: number = 0.3, color: string = '#ffffff') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    canvas.width = 256;
    canvas.height = 128;
    
    // 背景
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 文本
    context.font = `bold ${Math.floor(canvas.height / 2)}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true 
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size, size/2, 1);
    
    return sprite;
  }, []);
  
  // 使用共享的几何体
  const geometries = useMemo(() => {
    return SHARED_GEOMETRIES.lowDetail;
  }, []);
  
  // 根据状态获取光强度 - 使用节流更新避免高频计算
  const lastTimeRef = useRef<number>(0);
  const lastIntensityRef = useRef<number>(0.7);
  
  const getLightIntensity = useCallback((time: number) => {
    // 限制更新频率，每隔100ms才更新一次
    if (time - lastTimeRef.current < 0.1) {
      return lastIntensityRef.current;
    }
    
    let intensity: number;
    if (info.status === ManholeStatus.Alarm) {
      // 警报状态闪烁
      intensity = Math.sin(time * 10) * 0.5 + 1.0;
    } else if (info.status === ManholeStatus.Warning) {
      // 警告状态缓慢闪烁
      intensity = Math.sin(time * 5) * 0.3 + 0.7;
    } else {
      intensity = 0.7; // 正常亮度
    }
    
    lastTimeRef.current = time;
    lastIntensityRef.current = intensity;
    return intensity;
  }, [info.status]);
  
  // 清理函数，释放资源
  useEffect(() => {
    return () => {
      // 组件卸载时清理资源
      Object.values(materials).forEach(material => {
        if (material) {
          material.dispose();
        }
      });
    };
  }, [materials]);
  
  // 获取状态文本 - 使用useMemo缓存
  const statusText = useMemo(() => {
    switch (info.status) {
      case ManholeStatus.Normal:
        return '正常';
      case ManholeStatus.Warning:
        return '警告';
      case ManholeStatus.Alarm:
        return '报警';
      case ManholeStatus.Maintenance:
        return '维护中';
      case ManholeStatus.Offline:
        return '离线';
      default:
        return '正常';
    }
  }, [info.status]);

  // 初始化文本精灵
  useEffect(() => {
    // 创建ID文本精灵
    const idSprite = createTextSprite(info.id, 0.5);
    if (idSprite && idTextRef.current) {
      idTextRef.current.copy(idSprite);
    }
    
    // 创建状态文本精灵
    const statusSprite = createTextSprite(statusText, 0.4);
    if (statusSprite && statusTextRef.current) {
      statusTextRef.current.copy(statusSprite);
    }
  }, [info.id, statusText, createTextSprite]);
  
  // 处理井盖开合动画 - 使用帧率限制
  const frameCountRef = useRef(0);
  const FRAME_SKIP = 1; // 每隔1帧更新一次

  useFrame((state, delta) => {
    // 限制更新频率
    frameCountRef.current = (frameCountRef.current + 1) % (FRAME_SKIP + 1);
    if (frameCountRef.current !== 0) return;
    
    if (!coverRef.current) return;
    
    // 根据井盖状态设置旋转
    const targetRotation = coverStatus === CoverStatus.Open ? -Math.PI / 2 : 0;
    const currentRotation = coverRef.current.rotation.x;
    
    // 平滑过渡
    const newRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, delta * 2);
    coverRef.current.rotation.x = newRotation;
    
    // 更新发光强度
    if (statusLightRef.current) {
      statusLightRef.current.intensity = getLightIntensity(state.clock.getElapsedTime());
    }
    
    // 如果是选中状态，添加轻微的上下浮动效果
    if (selected && groupRef.current) {
      const floatOffset = Math.sin(state.clock.getElapsedTime() * 2) * 0.03;
      groupRef.current.position.y = floatOffset;
    }
  });
  
  // 渲染组件
  return (
    <group position={positionVector} onClick={onClick}>
      <group visible={true} ref={groupRef}>
        {/* 井筒 */}
        <mesh
          geometry={geometries.shaft}
          material={materials.shaftMaterial}
          position={[0, -0.25, 0]}
          castShadow
          receiveShadow
        />
        
        {/* 井底 */}
        <mesh
          geometry={geometries.bottom}
          material={materials.bottomMaterial}
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        />
        
        {/* 井盖 */}
        <mesh
          ref={coverRef}
          geometry={geometries.cover}
          material={materials.coverMaterial}
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          castShadow
          receiveShadow
        >
          {/* 井盖花纹 */}
          <mesh
            geometry={geometries.ring}
            material={materials.patternMaterial}
            position={[0, 0.025, 0]}
            rotation={[0, 0, 0]}
            castShadow
          />
        </mesh>
        
        {/* 状态光源 */}
        <pointLight
          ref={statusLightRef}
          color={statusColor}
          intensity={0.7}
          distance={2}
          position={[0, -0.2, 0]}
          castShadow={false}
        />
        
        {/* 发光效果 */}
        <mesh
          ref={glowRef}
          geometry={geometries.glow}
          material={materials.glowMaterial}
          position={[0, -0.25, 0]}
          scale={1.05}
          visible={currentStatus !== ManholeStatus.Normal}
        />
        
        {/* 井内水面 - 只在有水位时显示 */}
        <mesh
          geometry={geometries.water}
          material={materials.waterMaterial}
          position={[0, -0.48, 0]}  // 水位高度可以基于实时数据调整
          rotation={[-Math.PI / 2, 0, 0]}
          visible={true} // 可以根据实时数据中的水位决定是否显示
        />
      </group>
      
      {/* 选中时的高亮边框 - 仅在选中时渲染 */}
      {selected && (
        <>
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[0.55, 0.6, 16]} /> {/* 减少细分数 */}
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        </>
      )}
      
      {/* 井盖ID文本 - 使用精灵 */}
      <sprite
        ref={idTextRef}
        position={[0, 0.8, 0]}
        scale={[1, 0.5, 1]}
      />
      
      {/* 状态指示标签 - 使用精灵 */}
      <sprite
        ref={statusTextRef}
        position={[0, 1.2, 0]}
      />
    </group>
  );
};

// 导出性能监控指标
export const getInstanceCount = () => instanceCounter;

export default React.memo(ManholeCover3D); 