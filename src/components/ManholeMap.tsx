import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Segmented, Space, Tag, Typography } from 'antd';
import { AMap, AMapInfoWindow, AMapMarker } from './amap';
import { MAP_CONFIG } from '../config/mapConfig';
import { generateMockManholes } from '../mock-data/manholes';
import { ManholeInfo, ManholeStatus } from '../typings';
import SpatialDistributionBoard from './SpatialDistributionBoard';

interface ManholeMapProps {
  manholes: ManholeInfo[];
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  style?: React.CSSProperties;
  className?: string;
}

type MapEngine = 'spatial' | 'amap';
type MapManholeData = ManholeInfo & {
  latestGas?: number;
  latestWaterLevel?: number;
};

const { Text, Paragraph } = Typography;

const statusColorMap: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: '#2dd4bf',
  [ManholeStatus.Warning]: '#f59e0b',
  [ManholeStatus.Alarm]: '#fb7185',
  [ManholeStatus.Maintenance]: '#60a5fa',
  [ManholeStatus.Offline]: '#94a3b8'
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
  const color = statusColorMap[manhole.status] || '#2dd4bf';

  return `
    <div style="position:relative;transform:translate(-50%,-100%);">
      <div style="
        width:${selected ? 28 : 20}px;
        height:${selected ? 28 : 20}px;
        border-radius:999px;
        background:${color};
        border:2px solid rgba(255,255,255,0.92);
        box-shadow:0 0 0 ${selected ? 10 : 5}px ${color}25, 0 10px 24px rgba(15,23,42,0.45);
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
  const [engine, setEngine] = useState<MapEngine>('spatial');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
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

  const handleMarkerClick = useCallback((manhole: MapManholeData) => {
    setSelectedManhole(manhole);
    onSelectManhole?.(manhole.id);
  }, [onSelectManhole]);

  useEffect(() => {
    if (engine !== 'amap') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (!mapReady) {
        setMapError('高德地图在当前网络环境下不可用，系统已切回本地空间分布引擎。');
        setEngine('spatial');
      }
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [engine, mapReady]);

  if (resolvedManholes.length === 0) {
    return (
      <Card className={className} style={style}>
        <Empty description="暂无可展示的井盖定位数据" />
      </Card>
    );
  }

  return (
    <Card
      className={`map-shell ${className || ''}`}
      style={{ width: '100%', height: '100%', ...style }}
      bodyStyle={{ padding: 20, minHeight: 560 }}
      bordered={false}
    >
      <div className="map-shell-header">
        <div>
          <div className="panel-eyebrow">Geo Intelligence</div>
          <h2>城市空间分布与点位态势</h2>
          <Paragraph className="map-shell-copy">
            默认启用本地空间分布引擎，不依赖外部地图脚本。需要真实底图时再切换到高德模式。
          </Paragraph>
        </div>
        <Space direction="vertical" align="end" size={12}>
          <Segmented
            value={engine}
            options={[
              { label: '空间分布引擎', value: 'spatial' },
              { label: '高德底图', value: 'amap' }
            ]}
            onChange={(value) => {
              setMapError(null);
              setMapReady(false);
              setEngine(value as MapEngine);
            }}
          />
          <Space size={8} wrap>
            <Tag color="cyan">点位数 {resolvedManholes.length}</Tag>
            <Tag color={engine === 'spatial' ? 'blue' : 'geekblue'}>
              {engine === 'spatial' ? '本地可用' : mapReady ? '底图已连接' : '等待加载'}
            </Tag>
          </Space>
        </Space>
      </div>

      {mapError && (
        <Alert
          type="warning"
          showIcon
          className="map-fallback-alert"
          message="地图已自动降级"
          description={mapError}
          action={
            <Button size="small" onClick={() => setEngine('spatial')}>
              使用本地引擎
            </Button>
          }
        />
      )}

      {engine === 'spatial' ? (
        <SpatialDistributionBoard
          manholes={resolvedManholes}
          selectedManholeId={selectedManhole?.id}
          onSelectManhole={(manholeId) => {
            const target = resolvedManholes.find((item) => item.id === manholeId);
            if (target) {
              handleMarkerClick(target);
            }
          }}
        />
      ) : (
        <div className="map-canvas-shell">
          <div className="map-mode-note">
            <Text style={{ color: '#dbeafe' }}>
              当前为高德底图模式。如果脚本被网络策略拦截，系统会自动回退到本地空间分布引擎。
            </Text>
          </div>
          <div style={{ width: '100%', height: 560 }}>
            <AMap
              center={mapCenter}
              zoom={selectedManhole ? 16 : MAP_CONFIG.zoom}
              style={{ width: '100%', height: '100%' }}
              className="manhole-amap"
              onMapLoaded={() => {
                setMapReady(true);
                setMapError(null);
              }}
              onError={(error) => {
                setMapError(error);
                setEngine('spatial');
              }}
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
        </div>
      )}
    </Card>
  );
};

export default ManholeMap;
