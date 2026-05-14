import React, { useState, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Tabs } from 'antd';
import { SafetyOutlined, WarningOutlined, AlertOutlined, ToolOutlined, DisconnectOutlined } from '@ant-design/icons';
import HeifeiManholeMap from '../components/HeifeiManholeMap';
import { hefeiManholes } from '../mock-data/hefeiManholes';
import { ManholeInfo, ManholeStatus } from '../typings';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 合肥市智慧井盖地图页面
 */
const HefeiMapPage: React.FC = () => {
  // 状态管理
  const [selectedManhole, setSelectedManhole] = useState<ManholeInfo | null>(null);
  
  // 处理井盖选择
  const handleSelectManhole = useCallback((manholeId: string) => {
    const manhole = hefeiManholes.find(m => m.id === manholeId);
    if (manhole) {
      setSelectedManhole(manhole);
    }
  }, []);

  // 计算各状态数量
  const statusCounts = hefeiManholes.reduce((counts, manhole) => {
    counts[manhole.status] = (counts[manhole.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // 获取井盖状态对应的颜色
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

  // 获取井盖状态对应的图标
  const getStatusIcon = (status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal:
        return <SafetyOutlined style={{ color: getStatusColor(status) }} />;
      case ManholeStatus.Warning:
        return <WarningOutlined style={{ color: getStatusColor(status) }} />;
      case ManholeStatus.Alarm:
        return <AlertOutlined style={{ color: getStatusColor(status) }} />;
      case ManholeStatus.Maintenance:
        return <ToolOutlined style={{ color: getStatusColor(status) }} />;
      case ManholeStatus.Offline:
        return <DisconnectOutlined style={{ color: getStatusColor(status) }} />;
      default:
        return <SafetyOutlined style={{ color: getStatusColor(status) }} />;
    }
  };

  // 渲染井盖详情卡片
  const renderManholeDetailsCard = () => {
    if (!selectedManhole) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">请在地图上选择一个井盖以查看详情</Text>
          </div>
        </Card>
      );
    }

    return (
      <Card
        title={
          <div>
            <span style={{ marginRight: '8px' }}>{selectedManhole.name}</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: getStatusColor(selectedManhole.status),
                color: 'white',
                fontSize: '12px'
              }}
            >
              {selectedManhole.status}
            </span>
          </div>
        }
      >
        <Tabs defaultActiveKey="info">
          <TabPane tab="基本信息" key="info">
            <p><strong>ID:</strong> {selectedManhole.id}</p>
            <p><strong>安装日期:</strong> {selectedManhole.installationDate}</p>
            <p><strong>型号:</strong> {selectedManhole.model}</p>
            <p><strong>材料:</strong> {selectedManhole.material}</p>
            <p><strong>直径:</strong> {selectedManhole.diameter}cm</p>
            <p><strong>深度:</strong> {selectedManhole.depth}cm</p>
            <p><strong>制造商:</strong> {selectedManhole.manufacturer}</p>
          </TabPane>
          <TabPane tab="位置信息" key="location">
            <p><strong>地址:</strong> {selectedManhole.location.address}</p>
            <p><strong>区域:</strong> {selectedManhole.location.district}</p>
            <p><strong>城市:</strong> {selectedManhole.location.city}</p>
            <p><strong>省份:</strong> {selectedManhole.location.province}</p>
            <p><strong>经度:</strong> {selectedManhole.location.longitude.toFixed(6)}</p>
            <p><strong>纬度:</strong> {selectedManhole.location.latitude.toFixed(6)}</p>
          </TabPane>
          <TabPane tab="监测数据" key="data">
            {selectedManhole.latestData ? (
              <div>
                <p><strong>更新时间:</strong> {new Date(selectedManhole.latestData.timestamp).toLocaleString()}</p>
                <p><strong>水位:</strong> {selectedManhole.latestData.waterLevel}%</p>
                <p><strong>温度:</strong> {selectedManhole.latestData.temperature.toFixed(1)}°C</p>
                <p><strong>湿度:</strong> {selectedManhole.latestData.humidity.toFixed(1)}%</p>
                <p><strong>甲烷浓度:</strong> {selectedManhole.latestData.gasConcentration.ch4}ppm</p>
                <p><strong>一氧化碳浓度:</strong> {selectedManhole.latestData.gasConcentration.co}ppm</p>
                <p><strong>硫化氢浓度:</strong> {selectedManhole.latestData.gasConcentration.h2s}ppm</p>
                <p><strong>氧气浓度:</strong> {selectedManhole.latestData.gasConcentration.o2}%</p>
                <p><strong>电池电量:</strong> {selectedManhole.latestData.batteryLevel}%</p>
                <p><strong>信号强度:</strong> {selectedManhole.latestData.signalStrength}%</p>
                <p><strong>井盖状态:</strong> {selectedManhole.latestData.coverStatus}</p>
              </div>
            ) : (
              <Text type="secondary">暂无监测数据</Text>
            )}
          </TabPane>
          <TabPane tab="联系人" key="contact">
            <p><strong>负责人:</strong> {selectedManhole.manager}</p>
            <p><strong>联系电话:</strong> {selectedManhole.contactPhone}</p>
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', color: 'white', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ color: 'white', margin: '0' }}>合肥市智慧井盖监控系统</Title>
          <Text style={{ color: 'white' }}>当前时间: {new Date().toLocaleString()}</Text>
        </div>
      </Header>
      <Content style={{ padding: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Row gutter={16}>
                <Col span={4}>
                  <Statistic
                    title="井盖总数"
                    value={hefeiManholes.length}
                    suffix="个"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="正常"
                    value={statusCounts[ManholeStatus.Normal] || 0}
                    valueStyle={{ color: getStatusColor(ManholeStatus.Normal) }}
                    prefix={getStatusIcon(ManholeStatus.Normal)}
                    suffix="个"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="警告"
                    value={statusCounts[ManholeStatus.Warning] || 0}
                    valueStyle={{ color: getStatusColor(ManholeStatus.Warning) }}
                    prefix={getStatusIcon(ManholeStatus.Warning)}
                    suffix="个"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="告警"
                    value={statusCounts[ManholeStatus.Alarm] || 0}
                    valueStyle={{ color: getStatusColor(ManholeStatus.Alarm) }}
                    prefix={getStatusIcon(ManholeStatus.Alarm)}
                    suffix="个"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="维护中"
                    value={statusCounts[ManholeStatus.Maintenance] || 0}
                    valueStyle={{ color: getStatusColor(ManholeStatus.Maintenance) }}
                    prefix={getStatusIcon(ManholeStatus.Maintenance)}
                    suffix="个"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="离线"
                    value={statusCounts[ManholeStatus.Offline] || 0}
                    valueStyle={{ color: getStatusColor(ManholeStatus.Offline) }}
                    prefix={getStatusIcon(ManholeStatus.Offline)}
                    suffix="个"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={18}>
            <HeifeiManholeMap
              manholes={hefeiManholes}
              onSelectManhole={handleSelectManhole}
              selectedManholeId={selectedManhole?.id}
              style={{ height: 'calc(100vh - 220px)' }}
            />
          </Col>
          <Col span={6}>
            {renderManholeDetailsCard()}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default HefeiMapPage; 