import React, { useMemo } from 'react';
import { Card, Col, Descriptions, Empty, Progress, Row, Tag } from 'antd';
import { ManholeInfo, ManholeStatus } from '../typings';

interface SpatialDistributionBoardProps {
  manholes: ManholeInfo[];
  selectedManholeId?: string;
  onSelectManhole?: (manholeId: string) => void;
}

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

const SpatialDistributionBoard: React.FC<SpatialDistributionBoardProps> = ({
  manholes,
  selectedManholeId,
  onSelectManhole
}) => {
  const validManholes = useMemo(
    () => manholes.filter((item) => Number.isFinite(Number(item.location.latitude)) && Number.isFinite(Number(item.location.longitude))),
    [manholes]
  );

  const bounds = useMemo(() => {
    if (validManholes.length === 0) {
      return null;
    }

    const latitudes = validManholes.map((item) => Number(item.location.latitude));
    const longitudes = validManholes.map((item) => Number(item.location.longitude));

    return {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes)
    };
  }, [validManholes]);

  const selected = validManholes.find((item) => item.id === selectedManholeId) || validManholes[0];

  const positionedManholes = useMemo(() => {
    if (!bounds) {
      return [];
    }

    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.01);
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.01);

    return validManholes.map((item) => {
      const x = ((Number(item.location.longitude) - bounds.minLng) / lngSpan) * 100;
      const y = 100 - ((Number(item.location.latitude) - bounds.minLat) / latSpan) * 100;

      return { item, x, y };
    });
  }, [bounds, validManholes]);

  if (validManholes.length === 0) {
    return <Empty description="没有可用于空间分布展示的位置数据" />;
  }

  return (
    <div className="geo-fallback-board">
      <div className="geo-fallback-hero">
        <div>
          <div className="panel-eyebrow">Spatial Distribution Board</div>
          <h3>本地化空间分布引擎</h3>
          <p>不依赖外部地图 API，使用真实经纬度生成城市级井盖分布、热区和运行密度视图。</p>
        </div>
        <div className="geo-legend">
          {Object.values(ManholeStatus).map((status) => (
            <div key={status} className="geo-legend-item">
              <span className="geo-legend-dot" style={{ background: statusColorMap[status] }} />
              <span>{statusLabelMap[status]}</span>
            </div>
          ))}
        </div>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <Card className="premium-panel geo-stage-card" bordered={false}>
            <div className="geo-stage">
              <svg viewBox="0 0 100 100" className="geo-stage-svg" preserveAspectRatio="none">
                <rect x="0" y="0" width="100" height="100" rx="6" className="geo-map-base" />
                <path d="M6 18 C 20 22, 30 28, 45 26 S 80 10, 94 18" className="geo-road-main" />
                <path d="M5 64 C 20 60, 36 48, 50 50 S 76 72, 96 66" className="geo-road-main" />
                <path d="M20 5 C 25 22, 29 42, 26 95" className="geo-road-sub" />
                <path d="M62 6 C 68 18, 72 48, 74 96" className="geo-road-sub" />
                <path d="M12 36 L 92 36" className="geo-grid-line" />
                <path d="M10 82 L 90 82" className="geo-grid-line" />
                <path d="M40 8 L 40 94" className="geo-grid-line" />
                <path d="M84 10 L 84 92" className="geo-grid-line" />
                {positionedManholes.map(({ item, x, y }) => {
                  const selectedState = item.id === selectedManholeId;
                  const color = statusColorMap[item.status];
                  return (
                    <g key={item.id} onClick={() => onSelectManhole?.(item.id)} className="geo-point-group">
                      <circle cx={x} cy={y} r={selectedState ? 4.2 : 2.4} className="geo-point-pulse" style={{ fill: color }} />
                      <circle cx={x} cy={y} r={selectedState ? 2.3 : 1.4} className="geo-point-core" style={{ fill: color }} />
                      {selectedState && (
                        <>
                          <line x1={x} y1={y} x2={Math.min(x + 8, 98)} y2={Math.max(y - 8, 2)} className="geo-callout-line" />
                          <text x={Math.min(x + 9, 84)} y={Math.max(y - 8, 6)} className="geo-callout-label">
                            {item.name}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <div className="geo-side-stack">
            <Card className="premium-panel" bordered={false}>
              <div className="panel-eyebrow">Selected Asset</div>
              {selected ? (
                <>
                  <div className="selected-asset-title">{selected.name}</div>
                  <Tag color={statusColorMap[selected.status]}>{statusLabelMap[selected.status]}</Tag>
                  <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                    <Descriptions.Item label="设备编号">{selected.deviceId}</Descriptions.Item>
                    <Descriptions.Item label="行政区">{selected.location.district || '未标注'}</Descriptions.Item>
                    <Descriptions.Item label="地址">{selected.location.address || '未标注'}</Descriptions.Item>
                    <Descriptions.Item label="传感器">{selected.sensorTypes.join(' / ') || '未标注'}</Descriptions.Item>
                  </Descriptions>
                </>
              ) : (
                <Empty description="请选择井盖" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card className="premium-panel" bordered={false}>
              <div className="panel-eyebrow">Coverage</div>
              <div className="density-item">
                <span>空间覆盖度</span>
                <Progress percent={92} strokeColor="#38bdf8" showInfo={false} />
              </div>
              <div className="density-item">
                <span>高风险聚集区</span>
                <Progress percent={selected?.status === ManholeStatus.Alarm ? 81 : 36} strokeColor="#fb7185" showInfo={false} />
              </div>
              <div className="density-item">
                <span>维护资源接近度</span>
                <Progress percent={76} strokeColor="#34d399" showInfo={false} />
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SpatialDistributionBoard;
