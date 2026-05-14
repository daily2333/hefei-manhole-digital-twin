import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Row, Segmented, Space, Statistic, Tag } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { ManholeInfo, ManholeRealTimeData, ManholeStatus } from '../../typings';
import HefeiManholeScene from './HefeiManholeScene';
import { ErrorBoundary } from '../layout/ErrorBoundary';

interface ManholeSceneWrapperProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  style?: React.CSSProperties;
}

const statusLabels: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: '正常',
  [ManholeStatus.Warning]: '预警',
  [ManholeStatus.Alarm]: '报警',
  [ManholeStatus.Maintenance]: '维护',
  [ManholeStatus.Offline]: '离线'
};

const statusColors: Record<ManholeStatus, string> = {
  [ManholeStatus.Normal]: 'success',
  [ManholeStatus.Warning]: 'warning',
  [ManholeStatus.Alarm]: 'error',
  [ManholeStatus.Maintenance]: 'processing',
  [ManholeStatus.Offline]: 'default'
};

const ManholeSceneWrapper: React.FC<ManholeSceneWrapperProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sceneMode, setSceneMode] = useState<'night' | 'day'>('night');

  const sceneStats = useMemo(() => {
    const total = manholes.length;
    const online = manholes.filter((item) => item.status !== ManholeStatus.Offline).length;
    const alarming = manholes.filter((item) => item.status === ManholeStatus.Alarm).length;
    const selected = manholes.find((item) => item.id === selectedManholeId) || null;
    const averageBattery = Math.round(
      manholes.reduce((sum, item) => sum + (realTimeDataMap.get(item.id)?.batteryLevel || item.latestData?.batteryLevel || 0), 0) / Math.max(total, 1)
    );

    return { total, online, alarming, selected, averageBattery };
  }, [manholes, realTimeDataMap, selectedManholeId]);

  return (
    <ErrorBoundary fallback={<div className="error-card">3D 场景加载失败</div>}>
      <div className="scene-command-board" style={style}>
        <div className="scene-command-header">
          <div>
            <div className="panel-eyebrow">Immersive Command View</div>
            <h2>数字孪生总览舞台</h2>
            <p>以空间剧场方式重构 3D 井盖网络，突出风险、能量流、巡航视角与资产密度。</p>
          </div>
          <Space size={12} wrap>
            <Segmented
              value={sceneMode}
              options={[
                { label: '夜景巡航', value: 'night' },
                { label: '日景展示', value: 'day' }
              ]}
              onChange={(value) => setSceneMode(value as 'night' | 'day')}
            />
            <Button
              className="scene-expand-button"
              icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setIsExpanded((previous) => !previous)}
            >
              {isExpanded ? '收起舞台' : '展开舞台'}
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} className="scene-kpi-row">
          <Col xs={24} sm={12} xl={6}>
            <Card className="premium-panel metric-card" bordered={false}>
              <Statistic title="空间节点" value={sceneStats.total} valueStyle={{ color: '#f8fafc' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="premium-panel metric-card" bordered={false}>
              <Statistic title="在线设备" value={sceneStats.online} valueStyle={{ color: '#2dd4bf' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="premium-panel metric-card" bordered={false}>
              <Statistic title="告警目标" value={sceneStats.alarming} valueStyle={{ color: '#fb7185' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="premium-panel metric-card" bordered={false}>
              <Statistic title="平均电量" value={sceneStats.averageBattery} suffix="%" valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
        </Row>

        <div className={`scene-stage-wrapper ${isExpanded ? 'expanded' : ''}`}>
          <HefeiManholeScene
            manholes={manholes}
            realTimeDataMap={realTimeDataMap}
            onSelectManhole={onSelectManhole}
            selectedManholeId={selectedManholeId}
            isNightMode={sceneMode === 'night'}
          />
        </div>

        <div className="scene-lower-grid">
          <Card className="premium-panel" bordered={false}>
            <div className="panel-eyebrow">Active Focus</div>
            {sceneStats.selected ? (
              <>
                <div className="selected-asset-title">{sceneStats.selected.name}</div>
                <Tag color={statusColors[sceneStats.selected.status]}>{statusLabels[sceneStats.selected.status]}</Tag>
                <p className="scene-summary-copy">
                  已将当前井盖提升为 3D 场景焦点，选中节点会增强光束、标签和环形信号反馈。
                </p>
              </>
            ) : (
              <p className="scene-summary-copy">点击任意井盖节点后，右侧指标与底部数据条会联动到该资产。</p>
            )}
          </Card>
          <Card className="premium-panel" bordered={false}>
            <div className="panel-eyebrow">Scene Layers</div>
            <div className="scene-pill-group compact">
              <span>城市基底</span>
              <span>建筑阵列</span>
              <span>能量束流</span>
              <span>星域粒子</span>
            </div>
            <p className="scene-summary-copy">
              新场景不再是平面地块叠几何体，而是改成可展示节点密度、风险等级和运行状态的指挥舞台。
            </p>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ManholeSceneWrapper;
