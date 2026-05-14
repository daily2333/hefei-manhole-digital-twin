import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Badge, Spin, Tooltip, Empty } from 'antd';
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
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { fetchEnvironmentSummary } from '../../services/api/environmentService';
const { Text } = Typography;

const dashboardCardStyles = {
  header: { color: '#fff', borderBottom: '1px solid #1f4287' },
  body: { padding: '10px', height: 280 },
};

const statCardStyles = {
  body: { padding: '12px 16px' },
};

const statusCardStyles = {
  body: { padding: '12px', textAlign: 'center' as const },
};

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

// 仪表盘主组件
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
  // 计算统计指标
  const statistics = useMemo(() => {
    const totalDevices = manholes.length;
    const onlineDevices = manholes.filter(m => m.status !== ManholeStatus.Offline).length;
    const totalAlarms = alarms.filter(a => !a.isResolved).length;
    
    const emergencyAlarms = alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Emergency).length;
    const alertAlarms = alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Alert).length;
    const warningAlarms = alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Warning).length;
    const noticeAlarms = alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Notice).length;
    const infoAlarms = alarms.filter(a => !a.isResolved && a.level === AlarmLevel.Info).length;
    
    const onlinePercent = Math.round((onlineDevices / totalDevices) * 100);
    
    // 计算各种状态的井盖数量
    const normalCount = manholes.filter(m => m.status === ManholeStatus.Normal).length;
    const warningCount = manholes.filter(m => m.status === ManholeStatus.Warning).length;
    const alarmCount = manholes.filter(m => m.status === ManholeStatus.Alarm).length;
    const maintenanceCount = manholes.filter(m => m.status === ManholeStatus.Maintenance).length;
    const offlineCount = manholes.filter(m => m.status === ManholeStatus.Offline).length;
    
    return {
      totalDevices,
      onlineDevices,
      totalAlarms,
      emergencyAlarms,
      alertAlarms,
      warningAlarms,
      noticeAlarms,
      infoAlarms,
      onlinePercent,
      normalCount,
      warningCount,
      alarmCount,
      maintenanceCount,
      offlineCount
    };
  }, [manholes, alarms]);

  // 计算平均值
  const avgWaterLevel = useMemo(() => {
    const values = Array.from(realTimeDataMap.values()).map(d => d.waterLevel).filter(v => v != null);
    return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
  }, [realTimeDataMap]);
  const avgGasLevel = useMemo(() => {
    const values = Array.from(realTimeDataMap.values()).map(d => d.gasConcentration?.ch4 ?? 0).filter(v => v != null);
    return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
  }, [realTimeDataMap]);

  // 获取异常井盖
  const abnormalManholes = useMemo(() => {
    return manholes
      .filter(m => m.status === ManholeStatus.Warning || m.status === ManholeStatus.Alarm)
      .slice(0, 5);
  }, [manholes]);

  // 左侧系统运行状态环形图
  const renderSystemStatusGauge = () => {
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: `${performanceScore}%`,
        x: 'center',
        y: 'center',
        textStyle: {
          fontSize: 36,
          fontWeight: 'bold',
          color: '#32ccbc'
        }
      },
      tooltip: {
        formatter: '{b}: {c}%'
      },
      series: [
        {
          name: '系统运行状态',
          type: 'gauge',
          radius: '85%',
          center: ['50%', '50%'],
          startAngle: 225,
          endAngle: -45,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 15,
              color: [
                [0.3, '#ff4d4f'],
                [0.7, '#faad14'],
                [1, '#32ccbc']
              ]
            }
          },
          pointer: {
            length: '60%',
            width: 6,
            itemStyle: {
              color: '#32ccbc'
            }
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: 'auto'
            }
          },
          splitLine: {
            length: 14,
            lineStyle: {
              color: 'auto'
            }
          },
          axisLabel: {
            distance: -20,
            fontSize: 10,
            color: '#999'
          },
          detail: {
            offsetCenter: [0, '70%'],
            formatter: '系统状态',
            color: '#32ccbc',
            fontSize: 14
          },
          data: [{
            value: performanceScore,
            name: '系统状态'
          }],
          animation: true
        }
      ]
    };

    return (
      <Card 
        title="系统运行状态" 
        variant="borderless"
        className="dashboard-card"
        styles={dashboardCardStyles}
      >
        <ReactECharts 
          option={option} 
          style={{ height: 240 }}
          className="react-echarts"
        />
      </Card>
    );
  };

  // 右侧设备状态分布饼图
  const renderDeviceStatusPie = () => {
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: '#ccc'
        }
      },
      color: ['#52c41a', '#faad14', '#ff4d4f', '#1890ff', '#8c8c8c'],
      series: [
        {
          name: '井盖状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#0c1b30',
            borderWidth: 2
          },
          label: {
            show: false
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
            { value: statistics.normalCount, name: '正常' },
            { value: statistics.warningCount, name: '警告' },
            { value: statistics.alarmCount, name: '告警' },
            { value: statistics.maintenanceCount, name: '维护中' },
            { value: statistics.offlineCount, name: '离线' }
          ]
        }
      ]
    };

    return (
      <Card 
        title="设备状态分布" 
        variant="borderless"
        className="dashboard-card"
        styles={dashboardCardStyles}
      >
        <ReactECharts 
          option={option} 
          style={{ height: 240 }}
          className="react-echarts"
        />
      </Card>
    );
  };

  // 温度监测趋势图数据 - 从API获取真实数据
  const [tempChartData, setTempChartData] = useState<{ values: { hour: string; value: number }[] }>({ values: [] });
  
  useEffect(() => {
    const loadTempData = async () => {
      try {
        const envData = await fetchEnvironmentSummary('24h');
        if (envData.temperatureData && envData.temperatureData.length > 0) {
          const values = envData.temperatureData.map((d: any) => ({
            hour: new Date(d.time).getHours() + ':00',
            value: Math.round(d.value * 10) / 10
          }));
          setTempChartData({ values });
        } else {
          const temps = Array.from(realTimeDataMap.values()).map(d => d.temperature).filter(t => t != null);
          const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 25;
          const fallback = Array.from({ length: 24 }, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - 23 + i);
            return { hour: date.getHours() + ':00', value: Math.round(avgTemp * 10) / 10 };
          });
          setTempChartData({ values: fallback });
        }
      } catch (err) {
        console.error('获取温度数据失败:', err);
        const temps = Array.from(realTimeDataMap.values()).map(d => d.temperature).filter(t => t != null);
        const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 25;
        const fallback = Array.from({ length: 24 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() - 23 + i);
          return { hour: date.getHours() + ':00', value: Math.round(avgTemp * 10) / 10 };
        });
        setTempChartData({ values: fallback });
      }
    };
    loadTempData();
  }, [realTimeDataMap]);

  // 异常预警趋势图数据
  const alertChartData = useMemo(() => {
    const dayLabels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const warning = dayLabels.map((_, dayIdx) => {
      const dayStart = new Date(Date.now() - (6 - dayIdx) * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      return alarms.filter(a => {
        const t = new Date(a.time).getTime();
        return !a.isResolved && t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length;
    });
    const alarm = dayLabels.map((_, dayIdx) => {
      const dayStart = new Date(Date.now() - (6 - dayIdx) * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      return alarms.filter(a => {
        const t = new Date(a.time).getTime();
        return a.isResolved && t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length;
    });
    return { days: dayLabels, warningData: warning, alarmData: alarm };
  }, [alarms]);

  // 温度监测趋势图
  const renderTemperatureChart = () => {
    const tempValues = tempChartData.values;
    const hours = tempValues.map(t => t.hour);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#177ddc'
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: {
          lineStyle: {
            color: '#2a3f5d'
          }
        },
        axisLabel: {
          color: '#8c8c8c'
        }
      },
      yAxis: {
        type: 'value',
        name: '°C',
        nameTextStyle: {
          color: '#8c8c8c'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#2a3f5d'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#2a3f5d',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#8c8c8c'
        }
      },
      series: [
        {
          name: '平均温度',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: '#ff4d4f'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(255, 77, 79, 0.3)'
              }, {
                offset: 1,
                color: 'rgba(255, 77, 79, 0.05)'
              }]
            }
          },
          itemStyle: {
            color: '#ff4d4f',
            borderColor: '#ff4d4f',
            borderWidth: 2
          },
          data: tempValues.map(t => t.value)
        }
      ]
    };

    return (
      <Card 
        title="温度监测趋势" 
        variant="borderless"
        className="dashboard-card"
        styles={dashboardCardStyles}
        extra={<Tooltip title="刷新数据"><ReloadOutlined style={{ color: '#1890ff', cursor: 'pointer' }} /></Tooltip>}
      >
        <ReactECharts 
          option={option} 
          style={{ height: 240 }}
          className="react-echarts"
        />
      </Card>
    );
  };

  // 异常预警趋势图
  const renderAlertTrendChart = () => {
    const { days, warningData, alarmData } = alertChartData;
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['警告', '告警'],
        textStyle: {
          color: '#ccc'
        },
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: {
          lineStyle: {
            color: '#2a3f5d'
          }
        },
        axisLabel: {
          color: '#8c8c8c'
        }
      },
      yAxis: {
        type: 'value',
        name: '数量',
        nameTextStyle: {
          color: '#8c8c8c'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#2a3f5d'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#2a3f5d',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#8c8c8c'
        }
      },
      series: [
        {
          name: '警告',
          type: 'bar',
          stack: 'total',
          barWidth: '40%',
          emphasis: {
            focus: 'series'
          },
          itemStyle: {
            color: '#faad14'
          },
          data: warningData
        },
        {
          name: '告警',
          type: 'bar',
          stack: 'total',
          barWidth: '40%',
          emphasis: {
            focus: 'series'
          },
          itemStyle: {
            color: '#ff4d4f'
          },
          data: alarmData
        }
      ]
    };

    return (
      <Card 
        title="异常预警趋势" 
        variant="borderless"
        className="dashboard-card"
        styles={dashboardCardStyles}
        extra={<Tooltip title="刷新数据"><ReloadOutlined style={{ color: '#1890ff', cursor: 'pointer' }} /></Tooltip>}
      >
        <ReactECharts 
          option={option} 
          style={{ height: 240 }}
          className="react-echarts"
        />
      </Card>
    );
  };

  // 底部统计卡片
  const renderStatCards = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card 
            variant="borderless"
            className="stat-card"
            styles={statCardStyles}
          >
            <Statistic 
              title={<Text style={{ color: '#8c8c8c' }}>设备总数</Text>}
              value={statistics.totalDevices}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
              prefix={<SafetyOutlined style={{ fontSize: '20px' }} />}
              suffix="个"
            />
            <div className="stat-footer">
              <Badge status="success" text={<Text style={{ color: '#8c8c8c' }}>在线率: {statistics.onlinePercent}%</Text>} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            variant="borderless"
            className="stat-card"
            styles={statCardStyles}
          >
            <Statistic 
              title={<Text style={{ color: '#8c8c8c' }}>告警总数</Text>}
              value={statistics.totalAlarms}
              valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
              prefix={<AlertOutlined style={{ fontSize: '20px' }} />}
              suffix="条"
            />
            <div className="stat-footer">
              <Badge status="error" text={<Text style={{ color: '#8c8c8c' }}>紧急告警: {statistics.emergencyAlarms}条</Text>} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            variant="borderless"
            className="stat-card"
            styles={statCardStyles}
          >
            <Statistic 
              title={<Text style={{ color: '#8c8c8c' }}>平均水位</Text>}
              value={avgWaterLevel}
              valueStyle={{ color: '#32ccbc', fontSize: '28px' }}
              prefix={<RiseOutlined style={{ fontSize: '20px' }} />}
              suffix="mm"
            />
            <div className="stat-footer">
              <Badge status="success" text={<Text style={{ color: '#8c8c8c' }}>数据来自实时监测</Text>} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            variant="borderless"
            className="stat-card"
            styles={statCardStyles}
          >
            <Statistic 
              title={<Text style={{ color: '#8c8c8c' }}>平均气体浓度</Text>}
              value={avgGasLevel}
              valueStyle={{ color: '#faad14', fontSize: '28px' }}
              prefix={<CloudOutlined style={{ fontSize: '20px' }} />}
              suffix="ppm"
            />
            <div className="stat-footer">
              <Badge status="warning" text={<Text style={{ color: '#8c8c8c' }}>数据来自实时监测</Text>} />
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // 底部状态指标卡片组
  const renderStatusCards = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(82, 196, 26, 0.2)' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
            </div>
            <Statistic 
              value={statistics.normalCount}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
            <div className="status-title">正常</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(250, 173, 20, 0.2)' }}>
              <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
            </div>
            <Statistic 
              value={statistics.warningCount}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
            />
            <div className="status-title">警告</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(255, 77, 79, 0.2)' }}>
              <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            </div>
            <Statistic 
              value={statistics.alarmCount}
              valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
            />
            <div className="status-title">告警</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(24, 144, 255, 0.2)' }}>
              <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            </div>
            <Statistic 
              value={statistics.maintenanceCount}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
            <div className="status-title">维护中</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(140, 140, 140, 0.2)' }}>
              <CloseCircleOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
            </div>
            <Statistic 
              value={statistics.offlineCount}
              valueStyle={{ color: '#8c8c8c', fontSize: '24px' }}
            />
            <div className="status-title">离线</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card 
            variant="borderless"
            className="status-card"
            styles={statusCardStyles}
          >
            <div className="status-icon" style={{ backgroundColor: 'rgba(50, 204, 188, 0.2)' }}>
              <ThunderboltOutlined style={{ fontSize: '24px', color: '#32ccbc' }} />
            </div>
            <Statistic 
              value={Math.round(statistics.onlinePercent)}
              valueStyle={{ color: '#32ccbc', fontSize: '24px' }}
              suffix="%"
            />
            <div className="status-title">在线率</div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="dashboard-container" style={{ padding: '16px', backgroundColor: '#0c1b30' }}>
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '100px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Spin size="large" />
          <span>加载数据中...</span>
        </div>
      ) : (
        <>
          <style>
            {`
              .dashboard-card {
                background-color: #162a45;
                border: none;
                border-radius: 6px;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
                color: #fff;
              }
              .stat-card, .status-card {
                background-color: #162a45;
                border: none;
                border-radius: 6px;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
              }
              .stat-footer {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #2a3f5d;
              }
              .status-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px;
              }
              .status-title {
                color: #8c8c8c;
                margin-top: 4px;
              }
              .react-echarts {
                background-color: transparent !important;
              }
            `}
          </style>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              {renderSystemStatusGauge()}
            </Col>
            <Col span={8}>
              {renderTemperatureChart()}
            </Col>
            <Col span={8}>
              {renderDeviceStatusPie()}
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={12}>
              {renderAlertTrendChart()}
            </Col>
            <Col span={12}>
              <Card 
                title="异常设备列表" 
                variant="borderless"
                className="dashboard-card"
                styles={{
                  header: dashboardCardStyles.header,
                  body: { padding: '5px 16px', height: 280, overflowY: 'auto' },
                }}
              >
                {abnormalManholes.length > 0 ? (
                  abnormalManholes.map((manhole, index) => (
                    <div key={manhole.id} style={{ padding: '10px 0', borderBottom: index < abnormalManholes.length - 1 ? '1px solid #2a3f5d' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Badge 
                            status={manhole.status === ManholeStatus.Alarm ? 'error' : 'warning'} 
                            text={
                              <span style={{ color: '#fff', fontWeight: 'bold', marginRight: '8px' }}>
                                {manhole.name}
                              </span>
                            } 
                          />
                          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>ID: {manhole.id}</span>
                        </div>
                        <div>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '10px', 
                            backgroundColor: manhole.status === ManholeStatus.Alarm ? '#ff4d4f' : '#faad14',
                            fontSize: '12px',
                            color: '#fff'
                          }}>
                            {manhole.status === ManholeStatus.Alarm ? '告警' : '警告'}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: '5px', color: '#8c8c8c', fontSize: '12px' }}>
                        <div>位置: {manhole.location.address}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>最近告警: {manhole.latestData ? new Date(manhole.latestData.timestamp).toLocaleString() : '无数据'}</span>
                          <button
                            type="button"
                            style={{
                              color: '#1890ff',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无异常设备" />
                )}
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {renderStatCards()}
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {renderStatusCards()}
          </Row>
        </>
      )}
    </div>
  );
};

export default DashboardTab; 
