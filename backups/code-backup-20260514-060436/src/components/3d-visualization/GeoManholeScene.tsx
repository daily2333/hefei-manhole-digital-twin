import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Html,
  Stars,
  useHelper,
  Stats
} from '@react-three/drei';
import type { ManholeInfo as ManholeInfoType, ManholeRealTimeData, Scene3DConfig } from '../../typings';
import { CoverStatus, ManholeStatus } from '../../typings';
import ManholeCover3D from './ManholeCover3D';
import * as THREE from 'three';
import { Alert, Badge, Card, Divider, Space, Statistic, Tag, Typography, Spin, Progress, Button, Tooltip, Empty } from 'antd';
import { EyeOutlined, EnvironmentOutlined, SyncOutlined } from '@ant-design/icons';
import { MAP_CONFIG } from '../../config/mapConfig';
import { createSafeLngLat } from '../../utils/mapHelpers';

// 三维场景性能配置
const SCENE_CONFIG: Scene3DConfig = {
  maxInstanceCount: 2500,    // 支持2000+井盖模型
  loadTimeoutMs: 3000,       // 3秒内加载完成
  targetFPS: 30,             // 目标30FPS
  instancingEnabled: true,   // 启用实例化渲染
  lodLevels: 3               // LOD级别
};

interface GeoManholeSceneProps {
  manholes: ManholeInfoType[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
}

// 将经纬度坐标转换为场景坐标
const geoToScene = (lng: number, lat: number, centerLng: number, centerLat: number, scale: number = 100000): [number, number] => {
  // 使用墨卡托投影进行坐标转换
  const x = (lng - centerLng) * scale;
  const z = (lat - centerLat) * scale;
  return [x, z];
};

// 高德地图集成组件
const AMapLayer: React.FC<{
  center: [number, number],
  zoom: number,
  satelliteView: boolean,
  manholes: ManholeInfoType[],
  onMapLoaded: (map: any) => void
}> = ({ center, zoom, satelliteView, manholes, onMapLoaded }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // 确保安全配置已设置
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: MAP_CONFIG.securityJsCode
      };
    }

    // 使用高德地图API加载地图
    const loadMap = async () => {
      try {
        const AMap = await (window as any).AMap;
        if (!AMap) {
          throw new Error('高德地图API加载失败');
        }

        if (mapContainerRef.current && !mapInstanceRef.current) {
          // 创建地图实例
          const map = new AMap.Map(mapContainerRef.current, {
            center,
            zoom,
            pitch: 0,         // 俯仰角
            viewMode: '3D',   // 3D视图
            expandZoomRange: true,
            zooms: [3, 20],
            mapStyle: satelliteView ? 'amap://styles/satellite' : 'amap://styles/normal'
          });

          // 加载卫星图层
          if (satelliteView) {
            const satelliteLayer = new AMap.TileLayer.Satellite();
            map.add(satelliteLayer);
          }

          // 地图控制组件
          map.plugin(['AMap.Scale', 'AMap.ToolBar', 'AMap.MapType'], () => {
            map.addControl(new AMap.Scale());
            map.addControl(new AMap.ToolBar());
            map.addControl(new AMap.MapType({
              defaultType: satelliteView ? 1 : 0
            }));
          });

          mapInstanceRef.current = map;
          onMapLoaded(map);
        }
      } catch (error) {
        console.error('加载高德地图失败:', error);
      }
    };

    // 如果高德地图API已加载，直接初始化地图
    if ((window as any).AMap) {
      loadMap();
    } else {
      // 动态加载高德地图API
      const script = document.createElement('script');
      script.src = `${MAP_CONFIG.aMapURL}${MAP_CONFIG.apiKey}`;
      script.async = true;
      script.onload = loadMap;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, satelliteView, onMapLoaded]);

  // 更新地图视图类型
  useEffect(() => {
    if (mapInstanceRef.current) {
      if (satelliteView) {
        mapInstanceRef.current.setMapStyle('amap://styles/satellite');
      } else {
        mapInstanceRef.current.setMapStyle('amap://styles/normal');
      }
    }
  }, [satelliteView]);

  return (
    <div ref={mapContainerRef} style={{ 
      width: '100%', 
      height: '100%', 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      zIndex: 1
    }} />
  );
};

// 井盖3D模型层
const ManholeLayer: React.FC<{
  manholes: ManholeInfoType[],
  realTimeDataMap: Map<string, ManholeRealTimeData>,
  mapCenter: [number, number],
  onSelectManhole?: (manholeId: string) => void,
  selectedManholeId?: string
}> = ({ manholes, realTimeDataMap, mapCenter, onSelectManhole, selectedManholeId }) => {
  // 场景中心点（地图中心的经纬度）
  const centerLng = mapCenter[0];
  const centerLat = mapCenter[1];
  
  // 转换后的井盖位置数据
  const manholePositions = useMemo(() => {
    return manholes.map(manhole => {
      const lng = manhole.location.longitude;
      const lat = manhole.location.latitude;
      const [x, z] = geoToScene(lng, lat, centerLng, centerLat);
      return { ...manhole, scenePosition: [x, 0, z] as [number, number, number] };
    });
  }, [manholes, centerLng, centerLat]);

  return (
    <>
      {/* 添加基础光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      
      {/* 渲染井盖3D模型 */}
      {manholePositions.map(manhole => {
        const realTimeData = realTimeDataMap.get(manhole.id);
        const isSelected = manhole.id === selectedManholeId;
        
        return (
          <ManholeCover3D
            key={manhole.id}
            info={manhole}
            coverStatus={realTimeData?.coverStatus || CoverStatus.Closed}
            selected={isSelected}
            position={manhole.scenePosition}
            onClick={() => onSelectManhole && onSelectManhole(manhole.id)}
          />
        );
      })}
    </>
  );
};

// 井盖信息显示组件
const ManholeInfo: React.FC<{
  manhole: ManholeInfoType | null,
  realTimeData: ManholeRealTimeData | undefined
}> = ({ manhole, realTimeData }) => {
  if (!manhole) return null;
  
  return (
    <Card 
      size="small"
      style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        width: 300, 
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)'
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: 8 }} />
          <span>{manhole.name}</span>
          <Tag color={getStatusColor(manhole.status)} style={{ marginLeft: 8 }}>
            {getStatusText(manhole.status)}
          </Tag>
        </div>
      }
    >
      {realTimeData ? (
        <>
          <Statistic
            title="位置信息"
            value={manhole.location.address || '未知地址'}
            style={{ marginBottom: 16 }}
          />
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Statistic title="温度" value={`${realTimeData.temperature.toFixed(1)}°C`} />
            <Statistic title="湿度" value={`${realTimeData.humidity.toFixed(1)}%`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Statistic title="水位" value={`${realTimeData.waterLevel.toFixed(1)}mm`} />
            <Statistic title="气体浓度" value={`${realTimeData.gasConcentration.ch4.toFixed(1)}ppm`} />
          </div>
        </>
      ) : (
        <Empty description="暂无实时数据" />
      )}
    </Card>
  );
};

// 获取状态文本
const getStatusText = (status: ManholeStatus) => {
  switch (status) {
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
};

// 获取状态颜色
const getStatusColor = (status: ManholeStatus) => {
  switch (status) {
    case ManholeStatus.Normal:
      return 'success';
    case ManholeStatus.Warning:
      return 'warning';
    case ManholeStatus.Alarm:
      return 'error';
    case ManholeStatus.Maintenance:
      return 'processing';
    case ManholeStatus.Offline:
      return 'default';
    default:
      return 'success';
  }
};

// 加载指示器组件
const LoadingIndicator: React.FC<{progress: number}> = ({ progress }) => {
  return (
    <div style={{ 
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', 
      padding: '20px', 
      borderRadius: '8px',
      color: 'white',
      textAlign: 'center',
      width: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>加载中...</h4>
      <Progress percent={Math.round(progress)} status="active" />
    </div>
  );
};

// 主场景组件
const GeoManholeScene: React.FC<GeoManholeSceneProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId
}) => {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [satelliteView, setSatelliteView] = useState(true);
  
  // 计算中心点，优先使用选中的井盖位置
  const mapCenter = useMemo(() => {
    if (selectedManholeId) {
      const selectedManhole = manholes.find(m => m.id === selectedManholeId);
      if (selectedManhole) {
        return [selectedManhole.location.longitude, selectedManhole.location.latitude] as [number, number];
      }
    }
    
    // 使用所有井盖的平均位置
    if (manholes.length > 0) {
      let sumLng = 0;
      let sumLat = 0;
      let count = 0;
      
      manholes.forEach(manhole => {
        if (manhole.location && typeof manhole.location.longitude === 'number' && typeof manhole.location.latitude === 'number') {
          sumLng += manhole.location.longitude;
          sumLat += manhole.location.latitude;
          count++;
        }
      });
      
      if (count > 0) {
        return [sumLng / count, sumLat / count] as [number, number];
      }
    }
    
    // 默认中心点
    return MAP_CONFIG.center;
  }, [manholes, selectedManholeId]);
  
  // 加载场景
  useEffect(() => {
    if (manholes.length === 0) return;
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, SCENE_CONFIG.loadTimeoutMs);
    
    // 模拟加载进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += (100 - progress) * 0.1;
      setLoadProgress(Math.min(99, progress));
      
      if (progress > 98) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [manholes]);
  
  // 处理地图加载完成
  const handleMapLoaded = useCallback((map: any) => {
    setMapInstance(map);
    setLoading(false);
  }, []);
  
  // 根据选中的井盖ID查找井盖信息
  const selectedManhole = useMemo(() => {
    if (!selectedManholeId) return null;
    return manholes.find(m => m.id === selectedManholeId) || null;
  }, [selectedManholeId, manholes]);
  
  const selectedManholeData = useMemo(() => {
    if (!selectedManholeId) return undefined;
    return realTimeDataMap.get(selectedManholeId);
  }, [selectedManholeId, realTimeDataMap]);
  
  // 聚焦到选中的井盖
  useEffect(() => {
    if (mapInstance && selectedManhole) {
      mapInstance.setCenter([selectedManhole.location.longitude, selectedManhole.location.latitude]);
      mapInstance.setZoom(18); // 放大到较高级别
    }
  }, [mapInstance, selectedManhole]);
  
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: '#f0f2f5'
      }}
    >
      {error && (
        <Alert
          type="error"
          message="场景加载错误"
          description={error.message}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000
          }}
        />
      )}
      
      {loading && <LoadingIndicator progress={loadProgress} />}
      
      {/* 高德地图层 */}
      <AMapLayer 
        center={mapCenter}
        zoom={14}
        satelliteView={satelliteView}
        manholes={manholes}
        onMapLoaded={handleMapLoaded}
      />
      
      {/* Three.js 3D层 */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 50, 0], fov: 60, near: 1, far: 1000 }}
          style={{ background: 'transparent', pointerEvents: 'auto' }}
        >
          {!loading && (
            <ManholeLayer 
              manholes={manholes}
              realTimeDataMap={realTimeDataMap}
              mapCenter={mapCenter}
              onSelectManhole={onSelectManhole}
              selectedManholeId={selectedManholeId}
            />
          )}
          <OrbitControls 
            enableRotate={false}
            enablePan={false}
            enableZoom={false}
          />
        </Canvas>
      </div>
      
      {/* 控制按钮 */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
        <Tooltip title={satelliteView ? "切换到普通地图" : "切换到卫星地图"}>
          <Button 
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setSatelliteView(!satelliteView)}
          >
            {satelliteView ? "普通地图" : "卫星地图"}
          </Button>
        </Tooltip>
      </div>
      
      {/* 井盖信息显示 */}
      {selectedManhole && (
        <ManholeInfo 
          manhole={selectedManhole}
          realTimeData={selectedManholeData}
        />
      )}
    </div>
  );
};

export default GeoManholeScene; 