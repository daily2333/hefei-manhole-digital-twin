import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tooltip, Badge, Empty } from 'antd';
import { 
  ManholeInfo, 
  ManholeRealTimeData, 
  ManholeAlarm,
  AlarmLevel,
  ManholeStatus
} from '../../typings';
import {
  SafetyOutlined,
  AlertOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  ReloadOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Text } = Typography;

interface CyberDashboardProps {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  loading?: boolean;
  onRefresh?: () => void;
}

const CyberDashboard: React.FC<CyberDashboardProps> = ({
  manholes,
  alarms,
  realTimeDataMap,
  loading = false,
  onRefresh
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const total = manholes.length;
    const online = manholes.filter(m => m.status !== ManholeStatus.Offline).length;
    const offline = manholes.filter(m => m.status === ManholeStatus.Offline).length;
    const normal = manholes.filter(m => m.status === ManholeStatus.Normal).length;
    const warning = manholes.filter(m => m.status === ManholeStatus.Warning).length;
    const alarm = manholes.filter(m => m.status === ManholeStatus.Alarm).length;
    const maintenance = manholes.filter(m => m.status === ManholeStatus.Maintenance).length;
    const unresolvedAlarms = alarms.filter(a => !a.isResolved).length;
    const onlineRate = total > 0 ? Math.round((online / total) * 100) : 0;

    const rtdValues = Array.from(realTimeDataMap.values());
    const avgTemp = rtdValues.length > 0 
      ? Math.round(rtdValues.reduce((s, d) => s + (d.temperature || 0), 0) / rtdValues.length * 10) / 10 
      : 0;
    const avgHumidity = rtdValues.length > 0 
      ? Math.round(rtdValues.reduce((s, d) => s + (d.humidity || 0), 0) / rtdValues.length * 10) / 10 
      : 0;
    const avgWater = rtdValues.length > 0 
      ? Math.round(rtdValues.reduce((s, d) => s + (d.waterLevel || 0), 0) / rtdValues.length * 10) / 10 
      : 0;
    const avgBattery = rtdValues.length > 0 
      ? Math.round(rtdValues.reduce((s, d) => s + (d.batteryLevel || 0), 0) / rtdValues.length) 
      : 0;

    const healthScores = manholes.filter(m => m.healthScore).map(m => m.healthScore!.total);
    const avgHealth = healthScores.length > 0 
      ? Math.round(healthScores.reduce((s, v) => s + v, 0) / healthScores.length) 
      : 0;

    return { total, online, offline, normal, warning, alarm, maintenance, unresolvedAlarms, onlineRate, avgTemp, avgHumidity, avgWater, avgBattery, avgHealth };
  }, [manholes, alarms, realTimeDataMap]);

  const alarmTrendData = useMemo(() => {
    const days: string[] = [];
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      counts.push(alarms.filter(a => {
        const t = new Date(a.time).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length);
    }
    return { days, counts };
  }, [alarms]);

  const tempTrendData = useMemo(() => {
    const hours: string[] = [];
    const values: number[] = [];
    const rtdArr = Array.from(realTimeDataMap.values());
    const avgTemp = rtdArr.length > 0 
      ? rtdArr.reduce((s, d) => s + (d.temperature || 0), 0) / rtdArr.length 
      : 25;
    for (let i = 23; i >= 0; i--) {
      const d = new Date();
      d.setHours(d.getHours() - i);
      hours.push(`${d.getHours()}:00`);
      values.push(Math.round((avgTemp + (Math.random() - 0.5) * 4) * 10) / 10);
    }
    return { hours, values };
  }, [realTimeDataMap]);

  const districtStats = useMemo(() => {
    const districtMap = new Map<string, { total: number; alarm: number }>();
    manholes.forEach(m => {
      const d = m.location?.district || '未知区域';
      if (!districtMap.has(d)) districtMap.set(d, { total: 0, alarm: 0 });
      const cur = districtMap.get(d)!;
      cur.total++;
      if (m.status === ManholeStatus.Alarm || m.status === ManholeStatus.Warning) cur.alarm++;
    });
    const entries = Array.from(districtMap.entries()).slice(0, 8);
    return {
      districts: entries.map(([d]) => d),
      totals: entries.map(([, v]) => v.total),
      alarms: entries.map(([, v]) => v.alarm)
    };
  }, [manholes]);

  const recentAlarms = useMemo(() => {
    return alarms
      .filter(a => !a.isResolved)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [alarms]);

  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 20, top: 'center', textStyle: { color: '#ccc', fontSize: 12 } },
    color: ['#52c41a', '#faad14', '#ff4d4f', '#1890ff', '#8c8c8c'],
    series: [{
      name: '设备状态', type: 'pie', radius: ['45%', '75%'], center: ['40%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#0c1b30', borderWidth: 3 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: stats.normal, name: '正常' },
        { value: stats.warning, name: '警告' },
        { value: stats.alarm, name: '告警' },
        { value: stats.maintenance, name: '维护中' },
        { value: stats.offline, name: '离线' }
      ]
    }]
  }), [stats]);

  const alarmLineOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: alarmTrendData.days, axisLine: { lineStyle: { color: '#2a3f5d' } }, axisLabel: { color: '#8c8c8c' } },
    yAxis: { type: 'value', name: '告警数', nameTextStyle: { color: '#8c8c8c' }, axisLine: { show: true, lineStyle: { color: '#2a3f5d' } }, splitLine: { lineStyle: { color: '#2a3f5d', type: 'dashed' } }, axisLabel: { color: '#8c8c8c' } },
    series: [{
      name: '告警数量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
      lineStyle: { width: 3, color: '#ff4d4f' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,77,79,0.4)' }, { offset: 1, color: 'rgba(255,77,79,0.05)' }] } },
      itemStyle: { color: '#ff4d4f' },
      data: alarmTrendData.counts
    }]
  }), [alarmTrendData]);

  const barOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['井盖数量', '告警数量'], textStyle: { color: '#ccc' }, top: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: districtStats.districts, axisLine: { lineStyle: { color: '#2a3f5d' } }, axisLabel: { color: '#8c8c8c', rotate: 30 } },
    yAxis: { type: 'value', name: '数量', nameTextStyle: { color: '#8c8c8c' }, axisLine: { show: true, lineStyle: { color: '#2a3f5d' } }, splitLine: { lineStyle: { color: '#2a3f5d', type: 'dashed' } }, axisLabel: { color: '#8c8c8c' } },
    series: [
      { name: '井盖数量', type: 'bar', barWidth: '35%', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#1890ff80' }] }, borderRadius: [4, 4, 0, 0] }, data: districtStats.totals },
      { name: '告警数量', type: 'bar', barWidth: '35%', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ff4d4f' }, { offset: 1, color: '#ff4d4f80' }] }, borderRadius: [4, 4, 0, 0] }, data: districtStats.alarms }
    ]
  }), [districtStats]);

  const tempLineOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: tempTrendData.hours, axisLine: { lineStyle: { color: '#2a3f5d' } }, axisLabel: { color: '#8c8c8c' } },
    yAxis: { type: 'value', name: '°C', nameTextStyle: { color: '#8c8c8c' }, axisLine: { show: true, lineStyle: { color: '#2a3f5d' } }, splitLine: { lineStyle: { color: '#2a3f5d', type: 'dashed' } }, axisLabel: { color: '#8c8c8c' } },
    series: [{
      name: '温度', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, showSymbol: false,
      lineStyle: { width: 2, color: '#faad14' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(250,173,20,0.3)' }, { offset: 1, color: 'rgba(250,173,20,0.05)' }] } },
      itemStyle: { color: '#faad14' },
      data: tempTrendData.values
    }]
  }), [tempTrendData]);

  const renderChartCard = (title: string, option: any, height = 320) => (
    <Card 
      title={title} variant="borderless" className="cyber-card"
      styles={{ header: { color: '#fff', borderBottom: '1px solid rgba(24,144,255,0.3)' }, body: { padding: '16px', height } }}
    >
      <ReactECharts option={option} style={{ height: height - 40 }} className="cyber-echarts" />
    </Card>
  );

  const getLevelColor = (level: AlarmLevel) => {
    switch (level) {
      case AlarmLevel.Emergency: return '#ff4d4f';
      case AlarmLevel.Alert: return '#ff4d4f';
      case AlarmLevel.Warning: return '#faad14';
      case AlarmLevel.Notice: return '#1890ff';
      default: return '#8c8c8c';
    }
  };

  return (
    <div className="cyber-dashboard">
      <style>{`
        .cyber-dashboard { background: linear-gradient(135deg, #0a0f1a 0%, #0c1b30 100%); min-height: 100vh; padding: 24px; }
        .cyber-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .cyber-title { font-size: 28px; font-weight: bold; color: #fff; text-shadow: 0 0 20px rgba(24,144,255,0.5); letter-spacing: 2px; }
        .cyber-time { font-size: 16px; color: #8c8c8c; }
        .metric-card { background: rgba(22,42,69,0.6); border: 1px solid rgba(24,144,255,0.2); border-radius: 8px; padding: 20px 16px; text-align: center; transition: all 0.3s ease; cursor: default; min-height: 140px; display: flex; flex-direction: column; justify-content: center; }
        .metric-card:hover { border-color: rgba(24,144,255,0.5); background: rgba(22,42,69,0.9); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .metric-icon { margin-bottom: 8px; }
        .metric-label { color: #8c8c8c; font-size: 13px; margin-top: 4px; }
        .cyber-card { background: rgba(22,42,69,0.8); border: 1px solid rgba(24,144,255,0.3); border-radius: 8px; box-shadow: 0 0 20px rgba(24,144,255,0.1); transition: all 0.3s ease; }
        .cyber-card:hover { border-color: rgba(24,144,255,0.6); box-shadow: 0 0 30px rgba(24,144,255,0.2); }
        .cyber-card .ant-card-head { border-bottom: 1px solid rgba(24,144,255,0.3); }
        .cyber-card .ant-card-head-title { color: #fff; font-size: 16px; font-weight: 600; }
        .cyber-echarts { background-color: transparent !important; }
        .alarm-item { transition: background-color 0.2s ease; }
        .alarm-item:hover { background-color: rgba(24,144,255,0.1); }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Spin size="large" />
          <span style={{ color: '#8c8c8c' }}>加载数据中...</span>
        </div>
      ) : (
        <>
          <div className="cyber-header">
            <div className="cyber-title">智慧井盖数字孪生平台</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="cyber-time">{currentTime.toLocaleString('zh-CN')}</span>
              <Tooltip title="刷新数据"><ReloadOutlined style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }} onClick={onRefresh} /></Tooltip>
            </div>
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { key: 'total', label: '设备总数', value: stats.total, suffix: '个', color: '#1890ff', icon: <SafetyOutlined style={{ fontSize: 28, color: '#1890ff' }} /> },
              { key: 'online', label: '在线设备', value: stats.online, suffix: '个', color: '#52c41a', icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} /> },
              { key: 'alarm', label: '告警数量', value: stats.unresolvedAlarms, suffix: '条', color: '#ff4d4f', icon: <AlertOutlined style={{ fontSize: 28, color: '#ff4d4f' }} /> },
              { key: 'health', label: '健康评分', value: stats.avgHealth, suffix: '分', color: '#32ccbc', icon: <DashboardOutlined style={{ fontSize: 28, color: '#32ccbc' }} /> },
              { key: 'temp', label: '平均温度', value: stats.avgTemp, suffix: '°C', color: '#faad14', icon: <RiseOutlined style={{ fontSize: 28, color: '#faad14' }} /> },
              { key: 'humidity', label: '平均湿度', value: stats.avgHumidity, suffix: '%', color: '#722ed1', icon: <CloudOutlined style={{ fontSize: 28, color: '#722ed1' }} /> },
              { key: 'water', label: '平均水位', value: stats.avgWater, suffix: 'mm', color: '#13c2c2', icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#13c2c2' }} /> },
              { key: 'battery', label: '平均电量', value: stats.avgBattery, suffix: '%', color: '#52c41a', icon: <ToolOutlined style={{ fontSize: 28, color: '#52c41a' }} /> }
            ].map(m => (
              <Col xs={12} sm={8} md={6} lg={3} key={m.key}>
                <div className="metric-card">
                  <div className="metric-icon">{m.icon}</div>
                  <Statistic value={m.value} suffix={m.suffix} valueStyle={{ color: m.color, fontSize: 30, fontWeight: 'bold' }} />
                  <div className="metric-label">{m.label}</div>
                </div>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>{renderChartCard('设备状态分布', pieOption)}</Col>
            <Col xs={24} lg={12}>{renderChartCard('告警趋势（近7天）', alarmLineOption)}</Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>{renderChartCard('区域统计', barOption)}</Col>
            <Col xs={24} lg={12}>{renderChartCard('温度监测趋势（24h）', tempLineOption)}</Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="实时告警" variant="borderless" className="cyber-card" styles={{ header: { color: '#fff', borderBottom: '1px solid rgba(24,144,255,0.3)' }, body: { padding: 16, height: 200, overflowY: 'auto' } }}>
                {recentAlarms.length > 0 ? recentAlarms.map((alarm, i) => {
                  const manhole = manholes.find(m => m.id === alarm.manholeId);
                  return (
                    <div key={alarm.id} className="alarm-item" style={{ padding: '12px 0', borderBottom: i < recentAlarms.length - 1 ? '1px solid rgba(24,144,255,0.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge color={getLevelColor(alarm.level)} />
                          <Text strong style={{ color: '#fff' }}>{manhole?.name || '未知设备'}</Text>
                          <Text style={{ color: '#8c8c8c', fontSize: 12 }}>{alarm.type}</Text>
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>{alarm.description}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: getLevelColor(alarm.level), fontSize: 12, padding: '2px 8px', borderRadius: 4, backgroundColor: `${getLevelColor(alarm.level)}20`, display: 'inline-block' }}>{alarm.level}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 4 }}>{new Date(alarm.time).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                }) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无告警" style={{ color: '#8c8c8c' }} />}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default CyberDashboard;
