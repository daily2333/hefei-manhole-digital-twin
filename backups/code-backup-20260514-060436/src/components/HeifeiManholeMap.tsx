import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Typography, Empty, Spin, Alert, Badge, Statistic, Row, Col, Tooltip, notification } from 'antd';
import { AMap, AMapMarker, AMapInfoWindow } from './amap';
import { ManholeInfo, ManholeStatus, ManholeRealTimeData } from '../typings';
import { AMapInstance } from './amap/types';

// 合肥市中心坐标
const HEFEI_CENTER: [number, number] = [117.23, 31.83];

interface HeifeiManholeMapProps {
  manholes: ManholeInfo[];
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  style?: React.CSSProperties;
  className?: string;
}

// 地图使用的简化井盖数据结构
interface MapManholeData extends ManholeInfo {
  waterLevel?: number;
  gasConcentration?: number;
}

const { Text } = Typography;

/**
 * 合肥市智慧井盖地图组件
 */
const HeifeiManholeMap: React.FC<HeifeiManholeMapProps> = ({
  manholes = [],
  onSelectManhole,
  selectedManholeId,
  style = {},
  className = '',
}) => {
  const [infoWindow, setInfoWindow] = useState<{ 
    visible: boolean, 
    manhole: MapManholeData | null,
    position: [number, number] | null
  }>({
    visible: false,
    manhole: null,
    position: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  // 如果没有传入井盖数据，则生成模拟数据
  const [internalManholes, setInternalManholes] = useState<MapManholeData[]>([]);
  const [statusStatistics, setStatusStatistics] = useState<{[key: string]: number}>({});
  
  // 处理井盖数据转换
  useEffect(() => {
    if (manholes.length === 0) {
      // 如果没有数据，可以在这里生成模拟数据
      setInternalManholes([]);
    } else {
      // 将传入的ManholeInfo转换为MapManholeData
      const mapData = manholes.map(manhole => ({
        ...manhole,
        // 添加额外数据
        waterLevel: manhole.latestData?.waterLevel,
        gasConcentration: manhole.latestData?.gasConcentration?.ch4
      }));
      setInternalManholes(mapData);
    }
  }, [manholes]);
  
  // 计算各状态井盖数量
  useEffect(() => {
    const stats: {[key: string]: number} = {
      [ManholeStatus.Normal]: 0,
      [ManholeStatus.Warning]: 0,
      [ManholeStatus.Alarm]: 0,
      [ManholeStatus.Maintenance]: 0,
      [ManholeStatus.Offline]: 0
    };
    
    internalManholes.forEach(manhole => {
      if (stats[manhole.status] !== undefined) {
        stats[manhole.status]++;
      }
    });
    
    setStatusStatistics(stats);
  }, [internalManholes]);

  // 计算地图中心点
  const calculateCenter = useCallback((): [number, number] => {
    if (manholes.length === 0) {
      return HEFEI_CENTER;
    }

    if (selectedManholeId) {
      const selected = manholes.find(m => m.id === selectedManholeId);
      if (selected && selected.location) {
        const lng = Number(selected.location.longitude);
        const lat = Number(selected.location.latitude);
        if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
          return [lng, lat];
        }
      }
    }

    // 使用所有井盖的平均位置作为中心
    let totalLng = 0;
    let totalLat = 0;
    let validCount = 0;
    
    for (const manhole of manholes) {
      if (manhole.location) {
        const lng = Number(manhole.location.longitude);
        const lat = Number(manhole.location.latitude);
        if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
          totalLng += lng;
          totalLat += lat;
          validCount++;
        }
      }
    }
    
    if (validCount > 0) {
      return [totalLng / validCount, totalLat / validCount];
    }

    return HEFEI_CENTER;
  }, [manholes, selectedManholeId]);

  // 处理标记点点击
  const handleMarkerClick = useCallback((manhole: MapManholeData) => {
    if (!manhole || !manhole.location) {
      console.warn('尝试点击无效的井盖:', manhole);
      return;
    }
    
    try {
      // 确保经纬度有效
      const lng = Number(manhole.location.longitude);
      const lat = Number(manhole.location.latitude);
      
      setInfoWindow({
        visible: true,
        manhole,
        position: [lng, lat]
      });
      
      if (onSelectManhole) {
        onSelectManhole(manhole.id);
      }
    } catch (error) {
      console.error('处理标记点点击失败:', error);
    }
  }, [onSelectManhole]);

  // 关闭信息窗口
  const handleInfoWindowClose = useCallback(() => {
    setInfoWindow(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  // 获取安全的坐标
  const getSafeCoordinates = useCallback((manhole: MapManholeData): [number, number] => {
    if (!manhole || !manhole.location) {
      return HEFEI_CENTER;
    }
    
    try {
      const lng = Number(manhole.location.longitude);
      const lat = Number(manhole.location.latitude);
      
      if (isNaN(lng) || !isFinite(lng) || lng < -180 || lng > 180) {
        return HEFEI_CENTER;
      }
      
      if (isNaN(lat) || !isFinite(lat) || lat < -90 || lat > 90) {
        return HEFEI_CENTER;
      }
      
      return [lng, lat];
    } catch (error) {
      return HEFEI_CENTER;
    }
  }, []);

  // 处理地图加载完成
  const handleMapLoaded = useCallback((map: AMapInstance) => {
    setMapReady(true);
    setMapInstance(map);
    setLoading(false);
    console.log('地图加载完成，可以添加标记点');
  }, []);

  // 指定地图中心位置
  const center = React.useMemo(() => calculateCenter(), [calculateCenter]);
  
  // 获取状态对应的颜色
  const getStatusColor = (status: ManholeStatus): string => {
    switch (status) {
      case ManholeStatus.Normal:
        return '#52c41a'; // 绿色
      case ManholeStatus.Warning:
        return '#faad14'; // 黄色
      case ManholeStatus.Alarm:
        return '#f5222d'; // 红色
      case ManholeStatus.Maintenance:
        return '#1890ff'; // 蓝色
      case ManholeStatus.Offline:
        return '#8c8c8c'; // 灰色
      default:
        return '#52c41a'; // 默认绿色
    }
  };
  
  // 渲染井盖标记
  const renderManholeMarkers = () => {
    if (!mapReady || internalManholes.length === 0) return null;
    
    // 过滤出有效位置的井盖
    const validManholes = internalManholes.filter(m => 
      m.location && 
      typeof m.location.longitude === 'number' && 
      typeof m.location.latitude === 'number' &&
      // 确保坐标在有效范围内
      m.location.longitude > 116 && m.location.longitude < 119 &&
      m.location.latitude > 30 && m.location.latitude < 33
    );

    console.log('有效井盖数量:', validManholes.length);
    if (validManholes.length === 0) return null;

    return validManholes.map(manhole => {
      const coords = getSafeCoordinates(manhole);
      console.log('显示井盖:', manhole.id, coords);
      
      // 确定标记点大小 - 选中的井盖更大
      const isSelected = manhole.id === selectedManholeId;
      const sizeMultiplier = isSelected ? 1.5 : 1;
      
      // 构建自定义标记内容
      const markerContent = `
        <div class="manhole-marker" style="
          position: relative;
          width: ${26 * sizeMultiplier}px;
          height: ${26 * sizeMultiplier}px;
        ">
          <div style="
            background-color: ${getStatusColor(manhole.status)};
            border-radius: 50% 50% 50% 0;
            border: 2px solid white;
            width: ${26 * sizeMultiplier}px;
            height: ${26 * sizeMultiplier}px;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: ${12 * sizeMultiplier}px;
              text-align: center;
            ">
              ${manhole.id.slice(-2)}
            </div>
          </div>
          ${isSelected ? `<div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background-color: white;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          ">
            ${manhole.name}
          </div>` : ''}
        </div>
        <style>
          @keyframes pulse {
            0% { transform: rotate(-45deg) scale(1); }
            50% { transform: rotate(-45deg) scale(1.1); }
            100% { transform: rotate(-45deg) scale(1); }
          }
        </style>
      `;
      
      return (
        <AMapMarker
          key={manhole.id}
          position={coords}
          content={markerContent}
          zIndex={isSelected ? 110 : 100}
          onClick={() => handleMarkerClick(manhole)}
        />
      );
    });
  };

  // 渲染信息窗口内容
  const renderInfoWindowContent = (manhole: MapManholeData) => {
    if (!manhole) return null;
    
    return (
      <div style={{ padding: '5px', maxWidth: '300px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          {manhole.name} 
          <Badge 
            color={getStatusColor(manhole.status)} 
            text={manhole.status} 
            style={{ marginLeft: '8px' }} 
          />
        </div>
        
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
          {manhole.location.address}
        </div>
        
        {manhole.latestData && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>水位: {manhole.latestData.waterLevel}%</Col>
              <Col span={12}>温度: {manhole.latestData.temperature?.toFixed(1)}°C</Col>
              <Col span={12}>湿度: {manhole.latestData.humidity?.toFixed(1)}%</Col>
              <Col span={12}>甲烷: {manhole.latestData.gasConcentration?.ch4}ppm</Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  // 渲染地图
  const renderMap = () => {
    return (
      <>
        <AMap
          center={center}
          zoom={14}
          onMapLoaded={handleMapLoaded}
        >
          {/* 渲染井盖标记点 */}
          {renderManholeMarkers()}
          
          {/* 信息窗口 */}
          {infoWindow.visible && infoWindow.manhole && infoWindow.position && (
            <AMapInfoWindow
              position={infoWindow.position}
              visible={infoWindow.visible}
              onClose={handleInfoWindowClose}
              title={infoWindow.manhole.name}
            >
              {renderInfoWindowContent(infoWindow.manhole)}
            </AMapInfoWindow>
          )}
        </AMap>
        
        {/* 右侧状态图例 */}
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          borderRadius: '4px',
          color: 'white',
          fontSize: '12px',
          zIndex: 100
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>井盖状态图例</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(ManholeStatus.Normal), marginRight: '5px', borderRadius: '50%' }}></div>
            <span>正常 ({statusStatistics[ManholeStatus.Normal] || 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(ManholeStatus.Warning), marginRight: '5px', borderRadius: '50%' }}></div>
            <span>警告 ({statusStatistics[ManholeStatus.Warning] || 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(ManholeStatus.Alarm), marginRight: '5px', borderRadius: '50%' }}></div>
            <span>告警 ({statusStatistics[ManholeStatus.Alarm] || 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(ManholeStatus.Maintenance), marginRight: '5px', borderRadius: '50%' }}></div>
            <span>维护中 ({statusStatistics[ManholeStatus.Maintenance] || 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(ManholeStatus.Offline), marginRight: '5px', borderRadius: '50%' }}></div>
            <span>离线 ({statusStatistics[ManholeStatus.Offline] || 0})</span>
          </div>
        </div>
      </>
    );
  };

  // 渲染状态统计
  const renderStatusStatistics = () => {
    return (
      <div className="status-statistics">
        <Row gutter={[8, 8]}>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="正常" 
                value={statusStatistics[ManholeStatus.Normal] || 0} 
                valueStyle={{ color: getStatusColor(ManholeStatus.Normal) }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="警告" 
                value={statusStatistics[ManholeStatus.Warning] || 0} 
                valueStyle={{ color: getStatusColor(ManholeStatus.Warning) }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="告警" 
                value={statusStatistics[ManholeStatus.Alarm] || 0} 
                valueStyle={{ color: getStatusColor(ManholeStatus.Alarm) }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="离线/维护" 
                value={(statusStatistics[ManholeStatus.Offline] || 0) + (statusStatistics[ManholeStatus.Maintenance] || 0)} 
                valueStyle={{ color: getStatusColor(ManholeStatus.Offline) }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // 主组件渲染
  return (
    <Card 
      title="合肥市井盖分布"
      className={`hefei-manhole-map ${className}`}
      style={{ 
        height: '100%', 
        ...style 
      }}
      bodyStyle={{ 
        padding: 0, 
        height: 'calc(100% - 42px)', 
        position: 'relative' 
      }}
      extra={
        <span>总井盖数: {internalManholes.length}</span>
      }
    >
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column' 
        }}>
          <Spin size="large" tip="地图加载中..." />
          <div style={{ marginTop: '15px', color: '#888' }}>正在加载合肥市智慧井盖分布图</div>
        </div>
      ) : error ? (
        <Alert
          message="加载错误"
          description={error}
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      ) : internalManholes.length === 0 ? (
        <Empty 
          description="暂无井盖数据" 
          style={{ marginTop: '100px' }}
        />
      ) : (
        <div style={{ height: '100%', position: 'relative' }}>
          {renderMap()}
        </div>
      )}
    </Card>
  );
};

export default HeifeiManholeMap; 