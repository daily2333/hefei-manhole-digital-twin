import React, { useMemo } from 'react';
import { Button, Card, Col, Empty, Progress, Row, Space, Statistic, Table, Tag } from 'antd';
import { AlertOutlined, ReloadOutlined, RiseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { AlarmLevel, ManholeAlarm, ManholeInfo, ManholeRealTimeData, ManholeStatus } from '../../typings';

interface DashboardTabProps {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  selectedManhole: ManholeInfo | null;
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole: (manhole: ManholeInfo) => void;
  loading?: boolean;
  healthScoreCard?: React.ReactNode;
  onRefresh?: () => void;
  performanceScore?: number;
}

const levelWeight: Record<AlarmLevel, number> = {
  [AlarmLevel.Info]: 8,
  [AlarmLevel.Notice]: 16,
  [AlarmLevel.Warning]: 36,
  [AlarmLevel.Alert]: 64,
  [AlarmLevel.Emergency]: 100
};

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

const DashboardTab: React.FC<DashboardTabProps> = ({
  manholes,
  alarms,
  selectedManhole,
  realTimeDataMap,
  onSelectManhole,
  loading = false,
  healthScoreCard,
  onRefresh,
  performanceScore = 85
}) => {
  const metrics = useMemo(() => {
    const total = manholes.length;
    const online = manholes.filter((item) => item.status !== ManholeStatus.Offline).length;
    const activeAlerts = alarms.filter((item) => !item.isResolved);
    const alarmIndex = Math.min(
      100,
      activeAlerts.reduce((sum, item) => sum + levelWeight[item.level], 0) / Math.max(total, 1)
    );
    const averageBattery = Math.round(
      manholes.reduce((sum, item) => sum + (realTimeDataMap.get(item.id)?.batteryLevel || item.latestData?.batteryLevel || 0), 0) / Math.max(total, 1)
    );
    const coverage = Math.round((online / Math.max(total, 1)) * 100);

    return {
      total,
      online,
      activeAlerts,
      alarmIndex: Math.round(alarmIndex),
      averageBattery,
      coverage
    };
  }, [alarms, manholes, realTimeDataMap]);

  const trendSeries = useMemo(() => {
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '现在'];
    const values = labels.map((_, index) => {
      const base = 62 + Math.sin(index * 0.7) * 9;
      return Math.round(base + metrics.activeAlerts.length * 0.6);
    });
    const alarmValues = labels.map((_, index) => Math.max(1, Math.round(metrics.alarmIndex / 18 + Math.cos(index * 0.9) * 2 + index / 4)));

    return { labels, values, alarmValues };
  }, [metrics.activeAlerts.length, metrics.alarmIndex]);

  const riskDistribution = useMemo(() => {
    return Object.values(ManholeStatus).map((status) => ({
      name: statusLabelMap[status],
      value: manholes.filter((item) => item.status === status).length,
      itemStyle: { color: statusColorMap[status] }
    }));
  }, [manholes]);

  const highRiskAssets = useMemo(() => {
    return manholes
      .map((item) => {
        const data = realTimeDataMap.get(item.id) || item.latestData;
        const gas = data?.gasConcentration?.ch4 || 0;
        const score = item.status === ManholeStatus.Alarm ? 100 : item.status === ManholeStatus.Warning ? 72 : Math.min(65, gas / 2);
        return { item, score, gas, waterLevel: data?.waterLevel || 0 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [manholes, realTimeDataMap]);

  const trendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 20, right: 20, top: 36, bottom: 20, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: '#cbd5e1' } },
    xAxis: {
      type: 'category',
      data: trendSeries.labels,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.32)' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
        axisLabel: { color: '#94a3b8' }
      },
      {
        type: 'value',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8' }
      }
    ],
    series: [
      {
        name: '系统健康',
        type: 'line',
        smooth: true,
        data: trendSeries.values,
        lineStyle: { width: 3, color: '#38bdf8' },
        areaStyle: { color: 'rgba(56,189,248,0.16)' },
        symbolSize: 8
      },
      {
        name: '告警压力',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: 10,
        data: trendSeries.alarmValues,
        itemStyle: { color: '#fb7185', borderRadius: [8, 8, 0, 0] }
      }
    ]
  }), [trendSeries]);

  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['56%', '76%'],
        avoidLabelOverlap: false,
        label: { color: '#cbd5e1', formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: 'rgba(148,163,184,0.4)' } },
        data: riskDistribution
      }
    ]
  }), [riskDistribution]);

  const tableData = highRiskAssets.map(({ item, score, gas, waterLevel }) => ({
    key: item.id,
    name: item.name,
    district: item.location.district || '未标注',
    status: item.status,
    score,
    gas: gas.toFixed(1),
    waterLevel: waterLevel.toFixed(1)
  }));

  return (
    <div className="dashboard-premium">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="panel-eyebrow">Operations Command</div>
          <h2>城市井盖运行总览</h2>
          <p>重构后的首页以指挥台逻辑组织数据，先看系统态势，再下钻风险资产与重点监测对象。</p>
        </div>
        <Space size={12}>
          <Tag color="cyan">运行评分 {performanceScore}</Tag>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新态势
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="premium-panel metric-card" bordered={false}>
            <Statistic title="资产总量" value={metrics.total} valueStyle={{ color: '#f8fafc' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="premium-panel metric-card" bordered={false}>
            <Statistic title="在线覆盖率" value={metrics.coverage} suffix="%" valueStyle={{ color: '#2dd4bf' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="premium-panel metric-card" bordered={false}>
            <Statistic title="活跃告警" value={metrics.activeAlerts.length} valueStyle={{ color: '#fb7185' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="premium-panel metric-card" bordered={false}>
            <Statistic title="平均电量" value={metrics.averageBattery} suffix="%" valueStyle={{ color: '#60a5fa' }} prefix={<RiseOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
        <Col xs={24} xl={15}>
          <Card className="premium-panel chart-card" bordered={false}>
            <div className="card-header-inline">
              <div>
                <div className="panel-eyebrow">System Pulse</div>
                <h3>系统健康与告警压力</h3>
              </div>
              <div className="score-chip">{performanceScore}/100</div>
            </div>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="premium-panel chart-card" bordered={false}>
            <div className="panel-eyebrow">State Mix</div>
            <h3>设备状态构成</h3>
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
        <Col xs={24} xl={9}>
          <Card className="premium-panel" bordered={false}>
            <div className="panel-eyebrow">Risk Pressure</div>
            <div className="density-item">
              <span>告警指数</span>
              <Progress percent={metrics.alarmIndex} strokeColor="#fb7185" />
            </div>
            <div className="density-item">
              <span>调度余量</span>
              <Progress percent={Math.max(18, 100 - metrics.alarmIndex)} strokeColor="#38bdf8" />
            </div>
            <div className="density-item">
              <span>系统性能</span>
              <Progress percent={performanceScore} strokeColor="#2dd4bf" />
            </div>
          </Card>
          <Card className="premium-panel" bordered={false} style={{ marginTop: 16 }}>
            <div className="panel-eyebrow">Focused Asset</div>
            {selectedManhole ? (
              <>
                <div className="selected-asset-title">{selectedManhole.name}</div>
                <Tag color={statusColorMap[selectedManhole.status]}>{statusLabelMap[selectedManhole.status]}</Tag>
                <p className="scene-summary-copy">
                  {selectedManhole.location.address || '未标注地址'} · {selectedManhole.sensorTypes.join(' / ')}
                </p>
                {healthScoreCard}
              </>
            ) : (
              <Empty description="点击任意井盖后在此查看聚焦信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card className="premium-panel" bordered={false}>
            <div className="card-header-inline">
              <div>
                <div className="panel-eyebrow">Priority Assets</div>
                <h3>高风险资产队列</h3>
              </div>
              <Tag color="red">Top {tableData.length}</Tag>
            </div>
            <Table
              dataSource={tableData}
              pagination={false}
              size="small"
              className="premium-table"
              onRow={(record) => ({
                onClick: () => {
                  const manhole = manholes.find((item) => item.id === record.key);
                  if (manhole) {
                    onSelectManhole(manhole);
                  }
                }
              })}
              columns={[
                { title: '井盖', dataIndex: 'name', key: 'name' },
                { title: '区域', dataIndex: 'district', key: 'district' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (value: ManholeStatus) => <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
                },
                { title: '风险分', dataIndex: 'score', key: 'score' },
                { title: 'CH4', dataIndex: 'gas', key: 'gas' },
                { title: '水位', dataIndex: 'waterLevel', key: 'waterLevel' }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardTab;
