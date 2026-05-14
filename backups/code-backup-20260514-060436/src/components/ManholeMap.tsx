import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Statistic, Tag, Typography } from 'antd';
import { AMap, AMapInfoWindow, AMapMarker } from './amap';
import { MAP_CONFIG } from '../config/mapConfig';
import { generateMockManholes } from '../mock-data/manholes';
import { ManholeInfo, ManholeStatus } from '../typings';

interface ManholeMapProps {
  manholes: ManholeInfo[];
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  style?: React.CSSProperties;
  className?: string;
}

type MapManholeData = ManholeInfo & {
  latestGas?: number;
  latestWaterLevel?: number;
};

const { Text } = Typography;

const statusColorMap: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: '#52c41a',
  [ManholeStatus.Warning]: '#faad14',
  [ManholeStatus.Alarm]: '#f5222d',
  [ManholeStatus.Maintenance]: '#1890ff',
  [ManholeStatus.Offline]: '#8c8c8c'
};

const statusLabelMap: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: '正常',
  [ManholeStatus.Warning]: '预警',
  [ManholeStatus.Alarm]: '报警',
  [ManholeStatus.Maintenance]: '维护',
  [ManholeStatus.Offline]: '离线'
};

const defaultCenter = MAP_CONFIG.center;

const toMapData = (list: ManholeInfo[]): MapManholeData[] => list.map((manhole) => ({
  ...manhole,
  latestGas: manhole.latestData?.gasConcentration?.ch4,
  latestWaterLevel: manhole.latestData?.waterLevel
}));

const hasValidLocation = (manhole: ManholeInfo) => (
  Number.isFinite(Number(manhole.location?.longitude)) &&
  Number.isFinite(Number(manhole.location?.latitude))
);

const getMarkerContent = (manhole: MapManholeData, selected: boolean) => {
  const color = statusColorMap[manhole.status] || '#52c41a';

  return `
    <div style="position:relative;transform:translate(-50%,-100%);">
      ${selected ? `
        <div style="
          position:absolute;
          left:50%;
          top:-34px;
          transform:translateX(-50%);
          padding:4px 8px;
          border-radius:999px;
          background:rgba(4,21,39,0.92);
          color:#fff;
          font-size:12px;
          white-space:nowrap;
          border:1px solid rgba(255,255,255,0.15);
          box-shadow:0 8px 18px rgba(0,0,0,0.28);
        ">${manhole.name}</div>
      ` : ''}
      <div style="
        width:${selected ? 24 : 18}px;
        height:${selected ? 24 : 18}px;
        border-radius:50%;
        background:${color};
        border:3px solid rgba(255,255,255,0.95);
        box-shadow:0 0 0 6px ${selected ? `${color}33` : 'transparent'}, 0 10px 20px rgba(0,0,0,0.35);
      "></div>
    </div>
  `;
};

const ManholeMap: React.FC<ManholeMapProps> = ({
  manholes,
  onSelectManhole,
  selectedManholeId,
  style,
  className
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedManhole, setSelectedManhole] = useState<MapManholeData | null>(null);

  const resolvedManholes = useMemo(() => {
    const source = manholes.length > 0 ? manholes : generateMockManholes(30);
    return toMapData(source).filter(hasValidLocation);
  }, [manholes]);

  useEffect(() => {
    if (!selectedManholeId) {
      return;
    }

    const target = resolvedManholes.find((manhole) => manhole.id === selectedManholeId) || null;
    setSelectedManhole(target);
  }, [resolvedManholes, selectedManholeId]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedManhole && hasValidLocation(selectedManhole)) {
      return [Number(selectedManhole.location.longitude), Number(selectedManhole.location.latitude)];
    }

    if (resolvedManholes.length > 0) {
      const lng = resolvedManholes.reduce((sum, item) => sum + Number(item.location.longitude), 0) / resolvedManholes.length;
      const lat = resolvedManholes.reduce((sum, item) => sum + Number(item.location.latitude), 0) / resolvedManholes.length;
      return [lng, lat];
    }

    return defaultCenter;
  }, [resolvedManholes, selectedManhole]);

  const statusStats = useMemo(() => {
    return resolvedManholes.reduce<Record<ManholeStatus, number>>((accumulator, manhole) => {
      accumulator[manhole.status] += 1;
      return accumulator;
    }, {
      [ManholeStatus.Normal]: 0,
      [ManholeStatus.Warning]: 0,
      [ManholeStatus.Alarm]: 0,
      [ManholeStatus.Maintenance]: 0,
      [ManholeStatus.Offline]: 0
    });
  }, [resolvedManholes]);

  const handleMarkerClick = useCallback((manhole: MapManholeData) => {
    setSelectedManhole(manhole);
    onSelectManhole?.(manhole.id);
  }, [onSelectManhole]);

  if (resolvedManholes.length === 0) {
    return (
      <Card className={className} style={style}>
        <Empty description="暂无可展示的井盖定位数据" />
      </Card>
    );
  }

  return (
    <Card
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        border: '1px solid rgba(24, 144, 255, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
        ...style
      }}
      bodyStyle={{ padding: 0, height: '100%', minHeight: 520, position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 4,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(4, 21, 39, 0.82)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Text style={{ color: '#fff' }}>
          井盖总数 {resolvedManholes.length} | 地图状态 {mapReady ? '已就绪' : '加载中'}
        </Text>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 4,
          width: 250,
          padding: 14,
          borderRadius: 14,
          background: 'rgba(4, 21, 39, 0.82)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ color: '#fff', fontWeight: 600, marginBottom: 10 }}>状态统计</div>
        <Row gutter={[10, 10]}>
          {Object.values(ManholeStatus).map((status) => (
            <Col span={12} key={status}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12 }}>{statusLabelMap[status]}</span>}
                value={statusStats[status]}
                valueStyle={{ color: statusColorMap[status], fontSize: 18 }}
              />
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ width: '100%', height: '100%', minHeight: 520 }}>
        <AMap
          center={mapCenter}
          zoom={selectedManhole ? 16 : MAP_CONFIG.zoom}
          style={{ width: '100%', height: '100%' }}
          className="manhole-amap"
          onMapLoaded={() => setMapReady(true)}
        >
          {resolvedManholes.map((manhole) => (
            <AMapMarker
              key={manhole.id}
              position={[Number(manhole.location.longitude), Number(manhole.location.latitude)]}
              title={manhole.name}
              content={getMarkerContent(manhole, manhole.id === selectedManhole?.id)}
              extData={{ id: manhole.id }}
              zIndex={manhole.id === selectedManhole?.id ? 200 : 100}
              events={{
                click: () => handleMarkerClick(manhole)
              }}
            />
          ))}

          {selectedManhole && (
            <AMapInfoWindow
              position={[Number(selectedManhole.location.longitude), Number(selectedManhole.location.latitude)]}
              visible
              title={selectedManhole.name}
              onClose={() => setSelectedManhole(null)}
            >
              <div style={{ minWidth: 220 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selectedManhole.name}</div>
                <div style={{ marginBottom: 6 }}>
                  <Tag color={statusColorMap[selectedManhole.status]}>{statusLabelMap[selectedManhole.status]}</Tag>
                </div>
                <div style={{ marginBottom: 4 }}>ID: {selectedManhole.id}</div>
                <div style={{ marginBottom: 4 }}>
                  坐标: {Number(selectedManhole.location.latitude).toFixed(6)}, {Number(selectedManhole.location.longitude).toFixed(6)}
                </div>
                {selectedManhole.location.address && <div style={{ marginBottom: 4 }}>地址: {selectedManhole.location.address}</div>}
                {typeof selectedManhole.latestWaterLevel === 'number' && <div style={{ marginBottom: 4 }}>水位: {selectedManhole.latestWaterLevel.toFixed(1)}%</div>}
                {typeof selectedManhole.latestGas === 'number' && <div>CH4: {selectedManhole.latestGas.toFixed(1)} ppm</div>}
              </div>
            </AMapInfoWindow>
          )}
        </AMap>
      </div>
    </Card>
  );
};

export default ManholeMap;
