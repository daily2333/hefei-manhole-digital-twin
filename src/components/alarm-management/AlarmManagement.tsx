import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Card, Tabs, Button, Statistic, Badge, Progress, Space, Tooltip, Spin } from 'antd';
import { 
  AlertOutlined, 
  BellOutlined, 
  HistoryOutlined, 
  SettingOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { ManholeAlarm, AlarmLevel, AlarmType } from '../../typings';
import AlarmList from './AlarmList';
import { fetchAlarms, resolveAlarm, acknowledgeAlarm } from '../../services/api';
import { formatDateTime } from '../../utils';
import ReactECharts from 'echarts-for-react';



interface AlarmManagementProps {
  alarms?: ManholeAlarm[];
}

/**
 * 告警管理主页面组件
 */
const AlarmManagement: React.FC<AlarmManagementProps> = ({ alarms: propAlarms }) => {
  // 告警数据
  const [alarms, setAlarms] = useState<ManholeAlarm[]>(propAlarms || []);
  // 标签页
  const [activeTab, setActiveTab] = useState('1');
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  const fetchAlarmData = useCallback(async () => {
    setLoading(true);
    try {
      const alarmsData = await fetchAlarms();

      alarmsData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setAlarms(alarmsData);
    } catch (error) {
      console.error('获取告警数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 初始加载数据 - 只在没有props数据时获取
  useEffect(() => {
    if (propAlarms && propAlarms.length > 0) {
      setAlarms(propAlarms);
      return;
    }
    
    fetchAlarmData();
    const intervalId = setInterval(fetchAlarmData, 300000);
    return () => clearInterval(intervalId);
  }, [fetchAlarmData, propAlarms]);
  
  // 处理告警确认
  const handleAcknowledge = useCallback(async (alarmId: string) => {
    try {
      await acknowledgeAlarm(alarmId);
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => 
          alarm.id === alarmId 
            ? { ...alarm, acknowledgeTime: new Date().toISOString() } 
            : alarm
        )
      );
    } catch (error) {
      console.error('确认告警失败:', error);
    }
  }, []);
  
  // 处理告警解决
  const handleResolve = useCallback(async (alarmId: string) => {
    try {
      await resolveAlarm(alarmId);
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => 
          alarm.id === alarmId 
            ? { 
                ...alarm, 
                isResolved: true, 
                resolvedTime: new Date().toISOString(),
                resolvedBy: '当前用户',
                resolveNote: '人工处理'
              } 
            : alarm
        )
      );
    } catch (error) {
      console.error('解决告警失败:', error);
    }
  }, []);
  
  // 计算告警统计数据
  const alarmStatistics = {
    total: alarms.length,
    unresolved: alarms.filter(a => !a.isResolved).length,
    acknowledged: alarms.filter(a => a.acknowledgeTime && !a.isResolved).length,
    emergency: alarms.filter(a => a.level === AlarmLevel.Emergency && !a.isResolved).length,
    alert: alarms.filter(a => a.level === AlarmLevel.Alert && !a.isResolved).length,
    warning: alarms.filter(a => a.level === AlarmLevel.Warning && !a.isResolved).length,
    notice: alarms.filter(a => a.level === AlarmLevel.Notice && !a.isResolved).length,
    info: alarms.filter(a => a.level === AlarmLevel.Info && !a.isResolved).length,
  };

  // 告警趋势图表配置
  const alarmTrendOption = useMemo(() => {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const counts: Record<string, number[]> = { '紧急': [0,0,0,0,0,0,0], '严重': [0,0,0,0,0,0,0], '警告': [0,0,0,0,0,0,0], '提醒': [0,0,0,0,0,0,0], '信息': [0,0,0,0,0,0,0] };
    alarms.forEach(a => {
      const d = new Date(a.time);
      const dayIdx = d.getDay();
      const level = a.level === AlarmLevel.Emergency ? '紧急' : a.level === AlarmLevel.Alert ? '严重' : a.level === AlarmLevel.Warning ? '警告' : a.level === AlarmLevel.Notice ? '提醒' : '信息';
      if (counts[level]) counts[level][dayIdx]++;
    });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['紧急', '严重', '警告', '提醒', '信息'], textStyle: { color: 'rgba(255, 255, 255, 0.65)' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [{ type: 'category', data: dayNames, axisLabel: { color: 'rgba(255, 255, 255, 0.65)' } }],
      yAxis: [{ type: 'value', axisLabel: { color: 'rgba(255, 255, 255, 0.65)' } }],
      series: [
        { name: '紧急', type: 'bar', stack: '总量', data: counts['紧急'], itemStyle: { color: '#ff4d4f' } },
        { name: '严重', type: 'bar', stack: '总量', data: [0,0,0,0,0,0,0], itemStyle: { color: '#fa8c16' } },
        { name: '警告', type: 'bar', stack: '总量', data: counts['警告'], itemStyle: { color: '#faad14' } },
        { name: '提醒', type: 'bar', stack: '总量', data: counts['提醒'], itemStyle: { color: '#52c41a' } },
        { name: '信息', type: 'bar', stack: '总量', data: [0,0,0,0,0,0,0], itemStyle: { color: '#1890ff' } },
      ]
    };
  }, [alarms]);

  // 告警类型饼图配置
  const alarmTypeOption = useMemo(() => {
    const typeMap: Record<string, { value: number; color: string }> = {
      [AlarmType.WaterLevel]: { value: 0, color: '#1890ff' },
      [AlarmType.GasLevel]: { value: 0, color: '#52c41a' },
      [AlarmType.Temperature]: { value: 0, color: '#faad14' },
      [AlarmType.BatteryLow]: { value: 0, color: '#fa8c16' },
      [AlarmType.CoverOpen]: { value: 0, color: '#ff4d4f' },
      [AlarmType.Tilt]: { value: 0, color: '#8c8c8c' },
    };
    alarms.forEach(a => {
      if (typeMap[a.type]) typeMap[a.type].value++;
    });
    const data = Object.entries(typeMap).filter(([_, v]) => v.value > 0).map(([k, v]) => ({
      value: v.value, name: k, itemStyle: { color: v.color }
    }));
    return {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { top: '5%', left: 'center', textStyle: { color: 'rgba(255, 255, 255, 0.65)' } },
      series: [{
        name: '告警类型', type: 'pie', radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#041527', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data.length > 0 ? data : [{ value: 1, name: '暂无数据', itemStyle: { color: '#8c8c8c' } }]
      }]
    };
  }, [alarms]);
  
  return (
    <div className="alarm-management-container">
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" tip="加载数据中..." />
        </div>
      )}
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AlertOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                <span>告警管理中心</span>
              </div>
            }
            className="glass-card"
            extra={
              <Button type="primary" onClick={fetchAlarmData} loading={loading}>
                刷新数据
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="总告警数"
                    value={alarmStatistics.total}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<BellOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="未处理告警"
                    value={alarmStatistics.unresolved}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<Badge status="error" />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="已确认告警"
                    value={alarmStatistics.acknowledged}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="紧急告警"
                    value={alarmStatistics.emergency}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="严重告警"
                    value={alarmStatistics.alert}
                    valueStyle={{ color: '#fa8c16' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card bordered={false} className="glass-card inner-card">
                  <Statistic
                    title="警告告警"
                    value={alarmStatistics.warning}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <div className="alarm-level-progress">
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <Badge color="#ff4d4f" text="紧急告警" />
                    <Progress 
                      percent={alarmStatistics.total ? Math.round((alarmStatistics.emergency / alarmStatistics.total) * 100) : 0} 
                      strokeColor="#ff4d4f" 
                      strokeWidth={10}
                      style={{ width: 300 }}
                    />
                    <span>{alarmStatistics.emergency}</span>
                  </Space>
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <Badge color="#fa8c16" text="严重告警" />
                    <Progress 
                      percent={alarmStatistics.total ? Math.round((alarmStatistics.alert / alarmStatistics.total) * 100) : 0} 
                      strokeColor="#fa8c16" 
                      strokeWidth={10}
                      style={{ width: 300 }}
                    />
                    <span>{alarmStatistics.alert}</span>
                  </Space>
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <Badge color="#faad14" text="警告告警" />
                    <Progress 
                      percent={alarmStatistics.total ? Math.round((alarmStatistics.warning / alarmStatistics.total) * 100) : 0} 
                      strokeColor="#faad14" 
                      strokeWidth={10}
                      style={{ width: 300 }}
                    />
                    <span>{alarmStatistics.warning}</span>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="glass-card alarm-tabs"
            items={[
              {
                label: <span><BellOutlined />当前告警<Badge count={alarmStatistics.unresolved} style={{ marginLeft: 8 }} /></span>,
                key: '1',
                children: <AlarmList alarms={alarms.filter(a => !a.isResolved)} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
              },
              {
                label: <span><HistoryOutlined />历史告警</span>,
                key: '2',
                children: <AlarmList alarms={alarms.filter(a => a.isResolved)} />
              },
              {
                label: <span><SettingOutlined />告警配置</span>,
                key: '3',
                children: <Card title="告警规则配置" className="glass-card">
                  <p>此模块正在开发中，敬请期待...</p>
                  <p>您将可以在此配置不同类型告警的阈值、通知方式等设置。</p>
                </Card>
              },
            ]}
          />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                <span>告警趋势分析</span>
              </div>
            }
            className="glass-card"
          >
            <ReactECharts option={alarmTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AlertOutlined style={{ marginRight: 8 }} />
                <span>告警类型分布</span>
              </div>
            }
            className="glass-card"
          >
            <ReactECharts option={alarmTypeOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AlarmManagement; 