import React, { useState, useEffect, useCallback } from 'react';
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
import { fetchAlarms } from '../../services/api';
import { formatDateTime } from '../../utils';
import ReactECharts from 'echarts-for-react';



/**
 * 告警管理主页面组件
 */
const AlarmManagement: React.FC = () => {
  // 告警数据
  const [alarms, setAlarms] = useState<ManholeAlarm[]>([]);
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
  
  // 初始加载数据
  useEffect(() => {
    fetchAlarmData();
    
    // 设置定时刷新 - 每5分钟刷新一次，避免频繁刷新
    const intervalId = setInterval(() => {
      // 只对部分数据做增量更新，避免全量刷新带来的巨大差异
      setAlarms(prevAlarms => {
        // 随机选择1-3条告警进行状态更新
        const updatedAlarms = [...prevAlarms];
        const updateCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < updateCount; i++) {
          const index = Math.floor(Math.random() * updatedAlarms.length);
          // 有20%的概率将未解决的告警标记为已解决
          if (!updatedAlarms[index].isResolved && Math.random() < 0.2) {
            updatedAlarms[index] = {
              ...updatedAlarms[index],
              isResolved: true,
              resolvedTime: new Date().toISOString(),
              resolvedBy: ['张工', '李工', '王工'][Math.floor(Math.random() * 3)]
            };
          }
        }
        
        return updatedAlarms;
      });
      
      // 有10%的概率从API刷新告警数据
      if (Math.random() < 0.1) {
        fetchAlarms().then(newAlarms => {
          newAlarms.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setAlarms(newAlarms);
        }).catch(() => {});
      }
    }, 300000); // 5分钟更新一次
    
    return () => clearInterval(intervalId);
  }, [fetchAlarmData]);
  
  // 处理告警确认
  const handleAcknowledge = useCallback((alarmId: string) => {
    setAlarms(prevAlarms => 
      prevAlarms.map(alarm => 
        alarm.id === alarmId 
          ? { ...alarm, acknowledgeTime: new Date().toISOString() } 
          : alarm
      )
    );
  }, []);
  
  // 处理告警解决
  const handleResolve = useCallback((alarmId: string) => {
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
  const alarmTrendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['紧急', '严重', '警告', '提醒', '信息'],
      textStyle: {
        color: 'rgba(255, 255, 255, 0.65)'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.65)'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.65)'
        }
      }
    ],
    series: [
      {
        name: '紧急',
        type: 'bar',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: [2, 1, 3, 0, 2, 1, 2],
        itemStyle: {
          color: '#ff4d4f'
        }
      },
      {
        name: '严重',
        type: 'bar',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: [3, 4, 2, 3, 1, 2, 3],
        itemStyle: {
          color: '#fa8c16'
        }
      },
      {
        name: '警告',
        type: 'bar',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: [4, 3, 5, 6, 5, 3, 2],
        itemStyle: {
          color: '#faad14'
        }
      },
      {
        name: '提醒',
        type: 'bar',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: [5, 6, 4, 3, 4, 3, 4],
        itemStyle: {
          color: '#52c41a'
        }
      },
      {
        name: '信息',
        type: 'bar',
        stack: '总量',
        emphasis: {
          focus: 'series'
        },
        data: [7, 5, 6, 8, 6, 7, 5],
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  };

  // 告警类型饼图配置
  const alarmTypeOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.65)'
      }
    },
    series: [
      {
        name: '告警类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#041527',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '水位异常', itemStyle: { color: '#1890ff' } },
          { value: 25, name: '气体浓度异常', itemStyle: { color: '#52c41a' } },
          { value: 20, name: '温度异常', itemStyle: { color: '#faad14' } },
          { value: 10, name: '电池电量低', itemStyle: { color: '#fa8c16' } },
          { value: 5, name: '井盖开启', itemStyle: { color: '#ff4d4f' } },
          { value: 5, name: '其他', itemStyle: { color: '#8c8c8c' } }
        ]
      }
    ]
  };
  
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