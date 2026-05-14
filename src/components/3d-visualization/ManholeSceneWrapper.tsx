import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Switch, Tag, Tooltip } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import {
  ManholeInfo,
  ManholeRealTimeData,
  ManholeStatus,
} from '../../typings';
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
  const [isNightMode, setIsNightMode] = useState(true);

  const sceneStats = useMemo(() => {
    const total = manholes.length;
    const online = manholes.filter((item) => item.status !== ManholeStatus.Offline).length;
    const alarming = manholes.filter((item) => item.status === ManholeStatus.Alarm).length;
    const selected = manholes.find((item) => item.id === selectedManholeId) || null;

    return { total, online, alarming, selected };
  }, [manholes, selectedManholeId]);

  return (
    <ErrorBoundary fallback={<div className="error-card">3D 场景加载失败</div>}>
      <Card
        className="glass-card main-scene-card"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          background: 'linear-gradient(180deg, rgba(7,24,43,0.96), rgba(4,16,31,0.94))',
          ...style
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>合肥智慧井盖 3D 数字孪生</span>
            <Tag color="blue">空间监控</Tag>
            <Tag color={isNightMode ? 'cyan' : 'gold'}>{isNightMode ? '夜景模式' : '日景模式'}</Tag>
          </div>
        }
        extra={
          <Space size="middle">
            <Tooltip title={isNightMode ? '切换为日景' : '切换为夜景'}>
              <Switch
                checkedChildren={<EyeInvisibleOutlined />}
                unCheckedChildren={<EyeOutlined />}
                checked={isNightMode}
                onChange={setIsNightMode}
              />
            </Tooltip>
            <Tooltip title={isExpanded ? '退出大场景' : '展开大场景'}>
              <Button
                type="text"
                icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={() => setIsExpanded((previous) => !previous)}
              />
            </Tooltip>
          </Space>
        }
        bodyStyle={{
          padding: 18
        }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Statistic title="井盖总量" value={sceneStats.total} valueStyle={{ color: '#e6f4ff' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Statistic title="在线设备" value={sceneStats.online} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Statistic title="当前报警" value={sceneStats.alarming} valueStyle={{ color: '#f5222d' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>当前焦点</div>
              {sceneStats.selected ? (
                <>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{sceneStats.selected.name}</div>
                  <Tag color={statusColors[sceneStats.selected.status]} style={{ marginTop: 8 }}>
                    {statusLabels[sceneStats.selected.status]}
                  </Tag>
                </>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.75)' }}>未选中井盖</div>
              )}
            </Card>
          </Col>
        </Row>

        <div
          style={{
            position: 'relative',
            height: isExpanded ? 'calc(100vh - 250px)' : 620,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'radial-gradient(circle at top, rgba(34,94,168,0.28), rgba(2,11,23,0.96) 58%)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 24%, rgba(0,0,0,0.2))',
              zIndex: 1
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              zIndex: 2,
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(2, 10, 23, 0.68)',
              color: '#d6e4ff',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>空间态势</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              展示井盖、地标、预测状态与数据流，支持 hover 与选中联动。
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              right: 18,
              top: 18,
              zIndex: 2,
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(2, 10, 23, 0.68)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Space wrap>
              <Tag color="cyan">轨道相机</Tag>
              <Tag color="geekblue">地标映射</Tag>
              <Tag color="purple">预测面板</Tag>
            </Space>
          </div>

          <div className="scene-container-wrapper" style={{ height: '100%', width: '100%' }}>
            <HefeiManholeScene
              manholes={manholes}
              realTimeDataMap={realTimeDataMap}
              onSelectManhole={onSelectManhole}
              selectedManholeId={selectedManholeId}
              isNightMode={isNightMode}
            />
          </div>
        </div>
      </Card>
    </ErrorBoundary>
  );
};

export default ManholeSceneWrapper;
