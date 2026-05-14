import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Switch, 
  Button, 
  Select, 
  Space, 
  Statistic, 
  Tabs, 
  Tag,
  Spin,
  Alert,
  Empty,
  Tooltip
} from 'antd';
import {
  ClockCircleOutlined,
  DashboardOutlined,
  WarningOutlined,
  ReloadOutlined,
  AimOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DisconnectOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { ManholeInfo, ManholeRealTimeData, ManholeStatus, CoverStatus } from '../../typings';
import { Line } from '@ant-design/charts';



interface RealTimeMonitoringProps {
  manholes?: ManholeInfo[];
  realTimeDataMap?: Map<string, ManholeRealTimeData>;
}

const { Option } = Select;

// 监控数据类型
enum MonitoringType {
  SUMMARY = 'summary',
  WATER = 'water',
  GAS = 'gas',
  TEMPERATURE = 'temperature',
  BATTERY = 'battery',
  COVER = 'cover'
}



// 定义DeviceStatusPanel的属性类型
interface DeviceStatusPanelProps {
  device: ManholeInfo;
  realTimeData: ManholeRealTimeData;
  onSelectDevice: (deviceId: string) => void;
}

// 使用React.memo包装设备状态面板组件以避免不必要的重渲染
const DeviceStatusPanel = React.memo(({ device, realTimeData, onSelectDevice }: DeviceStatusPanelProps) => {
  // 提取DeviceStatusPanel的逻辑
  const getStatusColor = useCallback((status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal: return 'green';
      case ManholeStatus.Warning: return 'orange';
      case ManholeStatus.Alarm: return 'red';
      case ManholeStatus.Offline: return 'grey';
      default: return 'blue';
    }
  }, []);

  return (
    <Col span={8} key={device.id}>
      <Card 
        size="small"
        style={{ 
          marginBottom: 16, 
          borderLeft: `2px solid ${getStatusColor(device.status)}`,
          cursor: 'pointer'
        }}
        onClick={() => onSelectDevice(device.id)}
      >
        <Statistic
          title={`${device.name} (${device.location.district})`}
          value={device.status === ManholeStatus.Normal ? '正常' : 
                device.status === ManholeStatus.Warning ? '告警' : 
                device.status === ManholeStatus.Alarm ? '报警' : '离线'}
          valueStyle={{ color: getStatusColor(device.status) }}
          prefix={device.status === ManholeStatus.Normal ? <CheckCircleOutlined /> : 
                 device.status === ManholeStatus.Warning ? <WarningOutlined /> : 
                 device.status === ManholeStatus.Alarm ? <CloseCircleOutlined /> : 
                 <DisconnectOutlined />}
        />
      </Card>
    </Col>
  );
});

// 定义DetailMonitoringPanel的属性类型
interface DetailMonitoringPanelProps {
  selectedDevice: ManholeInfo | null;
  chartData: Record<string, any>;
}

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>加载出错，请刷新重试。</div>;
    }
    return this.props.children;
  }
}

// 使用React.memo包装详细监控面板组件
const DetailMonitoringPanel = React.memo(({ selectedDevice, chartData }: DetailMonitoringPanelProps) => {
  if (!selectedDevice) {
    return (
      <Card style={{ marginBottom: 16, height: '100%' }}>
        <Empty description="请选择一个设备以查看详细信息" />
      </Card>
    );
  }

  // 这里需要保留原始renderDetailMonitoringPanel函数中的代码
  return (
    <Card 
      title={
        <div>
          <MonitorOutlined style={{ marginRight: 8 }} />
          设备详细监控 - {selectedDevice.name}
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 设备状态信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic 
            title="设备状态" 
            value={
              selectedDevice.status === ManholeStatus.Normal ? '正常' :
              selectedDevice.status === ManholeStatus.Warning ? '告警' :
              selectedDevice.status === ManholeStatus.Alarm ? '报警' : '离线'
            }
            valueStyle={{ 
              color: 
                selectedDevice.status === ManholeStatus.Normal ? 'green' :
                selectedDevice.status === ManholeStatus.Warning ? 'orange' :
                selectedDevice.status === ManholeStatus.Alarm ? 'red' : 'grey'
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="安装位置" 
            value={selectedDevice.location.address} 
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="最后更新" 
            value="刚刚更新"
          />
        </Col>
      </Row>

      {/* 图表显示区域 */}
      <Tabs 
        defaultActiveKey="summary"
        items={[
          {
            label: '总体状况',
            key: 'summary',
            children: <ErrorBoundary fallback={<Empty description="图表加载出错" />}>
            {chartData && chartData[MonitoringType.SUMMARY] ?
              <Line 
                data={chartData[MonitoringType.SUMMARY].points || []}
                xField="timestamp"
                yField="value"
                point={{ size: 5, shape: 'diamond' }}
                title={chartData[MonitoringType.SUMMARY].title}
                height={300}
              /> : <Empty description="暂无数据" />
            }
          </ErrorBoundary>
          },
          {
            label: '水位监测',
            key: 'water',
            children: <ErrorBoundary fallback={<Empty description="图表加载出错" />}>
            {chartData && chartData[MonitoringType.WATER] ?
              <Line 
                data={chartData[MonitoringType.WATER].points || []}
                xField="timestamp"
                yField="value"
                point={{ size: 5, shape: 'diamond' }}
                title={chartData[MonitoringType.WATER].title}
                height={300}
              /> : <Empty description="暂无数据" />
            }
          </ErrorBoundary>
          },
          {
            label: '气体浓度',
            key: 'gas',
            children: <ErrorBoundary fallback={<Empty description="图表加载出错" />}>
            {chartData && chartData[MonitoringType.GAS] ?
              <Line 
                data={chartData[MonitoringType.GAS].points || []}
                xField="timestamp"
                yField="value"
                point={{ size: 5, shape: 'diamond' }}
                title={chartData[MonitoringType.GAS].title}
                height={300}
              /> : <Empty description="暂无数据" />
            }
          </ErrorBoundary>
          },
          {
            label: '温度监测',
            key: 'temperature',
            children: <ErrorBoundary fallback={<Empty description="图表加载出错" />}>
            {chartData && chartData[MonitoringType.TEMPERATURE] ?
              <Line 
                data={chartData[MonitoringType.TEMPERATURE].points || []}
                xField="timestamp"
                yField="value" 
                point={{ size: 5, shape: 'diamond' }}
                title={chartData[MonitoringType.TEMPERATURE].title}
                height={300}
              /> : <Empty description="暂无数据" />
            }
          </ErrorBoundary>
          },
        ]}
      />
    </Card>
  );
});

/**
 * 实时监控组件
 */
const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({
  manholes = [],
  realTimeDataMap = new Map()
}) => {
  const [selectedManholeId, setSelectedManholeId] = useState<string | null>(null);
  const [displayedDevices, setDisplayedDevices] = useState<ManholeInfo[]>([]);
  const [, setChartData] = useState<any>({});
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [deviceLimit, setDeviceLimit] = useState<number>(6);
  const [monitoringType] = useState<MonitoringType>(MonitoringType.SUMMARY);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataTimestamp, setDataTimestamp] = useState<string>(new Date().toISOString());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(3600); // 1小时刷新一次
  const [, setEventLog] = useState<any[]>([]);
  
  // 记录最后一次刷新的数据，用于比较变化
  const lastRefreshedDataRef = useRef<Map<string, ManholeRealTimeData>>(new Map());
  
  // 保存稳定的数据引用，避免不必要的重新计算
  const stableRealTimeDataMap = useRef<Map<string, ManholeRealTimeData>>(new Map());
  
  // 每次数据更新时，更新稳定引用
  useEffect(() => {
    stableRealTimeDataMap.current = realTimeDataMap;
  }, [realTimeDataMap]);
  
  // 保存生成的图表数据，避免重新渲染时重新生成
  const chartDataRef = useRef<any>(null);

  // 处理设备选择
  const handleSelectDevice = useCallback((deviceId: string) => {
    setSelectedManholeId(deviceId);
  }, []);
  
  // 更新图表数据函数定义在组件最顶部
  const updateChartData = useCallback((selectedId?: string | null, dataMap?: Map<string, ManholeRealTimeData>) => {
    // 使用参数或状态值
    const currentManholeId = selectedId || selectedManholeId;
    const currentDataMap = dataMap || stableRealTimeDataMap.current;
    
    // 如果没有选中设备，则不更新图表
    if (!currentManholeId) {
      return {
        title: '请选择设备',
        points: []
      };
    }
    
    const selectedManhole = manholes.find(m => m.id === currentManholeId);
    if (!selectedManhole) return {};
    
    const realTimeData = currentDataMap.get(currentManholeId);
    if (!realTimeData) return {};
    
    // 如果图表数据已经生成过，且没有进行刷新操作，则直接使用缓存的数据
    if (chartDataRef.current && 
        chartDataRef.current.manholeId === currentManholeId && 
        chartDataRef.current.type === monitoringType && 
        !loading) {
      return chartDataRef.current.data;
    }
    
    // 获取当前真实数据作为基础
    let currentValue: number;
    switch (monitoringType) {
      case MonitoringType.WATER:
        currentValue = realTimeData.waterLevel;
        break;
      case MonitoringType.GAS:
        currentValue = realTimeData.gasConcentration.ch4;
        break;
      case MonitoringType.TEMPERATURE:
        currentValue = realTimeData.temperature;
        break;
      case MonitoringType.BATTERY:
        currentValue = realTimeData.batteryLevel;
        break;
      case MonitoringType.COVER:
        currentValue = realTimeData.coverStatus === CoverStatus.Closed ? 0 : 
                     realTimeData.coverStatus === CoverStatus.PartialOpen ? 1 : 2;
        break;
      case MonitoringType.SUMMARY:
      default:
        currentValue = realTimeData.signalStrength;
    }

    // 获取季节和时间影响因子
    const hour = new Date().getHours(); // 获取当前小时(0-23)
    
    // 计算日周期温度因子 (-1到1)，中午最高，凌晨最低
    const dayTempFactor = Math.sin((hour - 6) * Math.PI / 12);
    
    // 使用固定种子生成稳定的历史数据，确保每次渲染时相同
    const generateStableRandomValue = (seed: number, range: number) => {
      // 使用伪随机数生成器，基于种子
      const x = Math.sin(seed) * 10000;
      return ((x - Math.floor(x)) * 2 - 1) * range;
    };
    
    // 生成模拟的历史数据点
    const points = [];
    const now = new Date();
    
    // 从最远的时间点开始向现在生成
    for (let i = 60; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000).toISOString();
      const point: any = { timestamp };
      
      // 如果是当前时间点，使用实时数据
      if (i === 0) {
        point.value = currentValue;
      } else {
        // 历史点根据类型生成适当的波动
        const seed = parseInt(currentManholeId.replace(/\D/g, '')) * 1000 + i + monitoringType.length;
        
        // 使用趋势函数获取自然变化
        let trendFunction;
        let maxChange = 0.1; // 默认最大变化幅度
        
        switch (monitoringType) {
          case MonitoringType.WATER:
            maxChange = 0.5; // mm/分钟
            // 水位变化通常较慢，除非突发下雨
            trendFunction = (minute: number) => {
              // 判断是否有降雨事件，使用确定性方法
              const rainyEvent = Math.sin((minute + parseInt(currentManholeId.replace(/\D/g, ''))) * 0.1) > 0.85;
              if (rainyEvent) {
                return Math.sin(minute * 0.2) * 1.5; // 雨水事件时有较大波动
              }
              return Math.sin(minute * 0.05) * 0.7; // 通常变化较小
            };
            break;
            
          case MonitoringType.GAS:
            maxChange = 0.2; // ppm/分钟
            // 气体浓度变化比较平滑
            trendFunction = (minute: number) => 
              Math.sin(minute * 0.1) * 0.8 + Math.sin(minute * 0.05) * 0.2;
            break;
            
          case MonitoringType.TEMPERATURE:
            maxChange = 0.05; // °C/分钟
            // 温度变化与时间相关
            trendFunction = (minute: number) => 
              Math.sin(minute * 0.1) * 0.6 * dayTempFactor + Math.sin(minute * 0.03) * 0.4;
            break;
            
          case MonitoringType.BATTERY:
            maxChange = 0.02; // %/分钟
            // 电池电量通常缓慢下降
            trendFunction = (minute: number) => -0.8 + Math.sin(minute * 0.02) * 0.2;
            break;
            
          case MonitoringType.COVER:
            maxChange = 0; // 井盖状态通常不频繁变化
            trendFunction = () => 0;
            break;
            
          case MonitoringType.SUMMARY:
          default:
            maxChange = 0.1; // %/分钟
            // 综合状态波动
            trendFunction = (minute: number) => 
              Math.sin(minute * 0.08) * 0.7 + Math.sin(minute * 0.02) * 0.3;
        }
        
        // 应用趋势函数和随机波动
        const trend = trendFunction(i) * maxChange;
        const randomFactor = generateStableRandomValue(seed, maxChange * 0.5);
        let value = currentValue + trend + randomFactor * i;
        
        // 确保值在合理范围内
        switch (monitoringType) {
          case MonitoringType.WATER:
            value = Math.max(0, value);
            break;
          case MonitoringType.GAS:
            value = Math.max(0, value);
            break;
          case MonitoringType.TEMPERATURE:
            // 温度没有特定限制
            break;
          case MonitoringType.BATTERY:
            value = Math.min(100, Math.max(0, value));
            break;
          case MonitoringType.COVER:
            value = Math.round(value) % 3; // 0, 1, 2
            break;
          case MonitoringType.SUMMARY:
            value = Math.min(100, Math.max(0, value));
            break;
        }
        
        point.value = value;
      }
      
      points.push(point);
    }
    
    points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // 生成一个结果对象
    const getLabel = (type: MonitoringType): string => {
      switch (type) {
        case MonitoringType.WATER: return '水位监测';
        case MonitoringType.GAS: return '气体浓度';
        case MonitoringType.TEMPERATURE: return '温度监测';
        case MonitoringType.BATTERY: return '电池电量';
        case MonitoringType.COVER: return '井盖状态';
        case MonitoringType.SUMMARY: return '综合信息';
        default: return '未知类型';
      }
    };
    const result = {
      title: `${selectedManhole.name} - ${getLabel(monitoringType)}`,
      points
    };
    
    // 缓存结果
    chartDataRef.current = {
      manholeId: currentManholeId,
      type: monitoringType,
      data: result
    };
    
    return result;
  }, [manholes, monitoringType, selectedManholeId, loading]);

  // 刷新数据 - 修复函数调用
  const refreshData = useCallback(() => {
    setLoading(true);
    
    // 更新最后刷新时间
    const newTimestamp = new Date().toISOString();
    setDataTimestamp(newTimestamp);
    
    // 生成图表数据并更新状态
    const newChartData = updateChartData(selectedManholeId, realTimeDataMap);
    setChartData(newChartData);
    
    // 更新已刷新数据的引用
    lastRefreshedDataRef.current = new Map(realTimeDataMap);
    
    // 模拟API调用延迟
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [realTimeDataMap, selectedManholeId, updateChartData]);

  // 优化chartData计算
  const optimizedChartData = useCallback(() => {
    try {
      if (!selectedManholeId) return {};
      // 直接调用函数生成数据
      const result = updateChartData(selectedManholeId, realTimeDataMap);
      return {
        [MonitoringType.SUMMARY]: result,
        [MonitoringType.WATER]: result,
        [MonitoringType.GAS]: result,
        [MonitoringType.TEMPERATURE]: result,
        [MonitoringType.BATTERY]: result,
        [MonitoringType.COVER]: result
      };
    } catch (error) {
      console.error('生成图表数据出错:', error);
      return {};
    }
  }, [selectedManholeId, realTimeDataMap, updateChartData]);

  // 优化设备状态面板渲染，使用memo组件替代函数
  const updateDisplayedDevices = useCallback(() => {
    setDisplayedDevices(manholes.filter(device => 
      device.location.district.includes(selectedAreaFilter)
    ));
  }, [manholes, selectedAreaFilter]);

  // 保留原始的renderDeviceStatusPanel函数，但内部调用我们的优化版本
  const renderDeviceStatusPanel = useCallback((device: ManholeInfo) => {
    return (
      <DeviceStatusPanel 
        key={device.id}
        device={device}
        realTimeData={stableRealTimeDataMap.current.get(device.id) || {} as ManholeRealTimeData}
        onSelectDevice={handleSelectDevice}
      />
    );
  }, [stableRealTimeDataMap, handleSelectDevice]);

  // 修改现有useEffect的依赖项
  useEffect(() => {
    updateDisplayedDevices();
  }, [updateDisplayedDevices]);

  // 生成模拟的实时事件日志
  const generateEventLog = useCallback(() => {
    const events = [
      '设备数据更新',
      '电池电量检测',
      '水位读数',
      '气体浓度读数',
      '通信状态检查',
      '倾斜度测量',
      '井盖状态检测',
      '传感器自检'
    ];
    
    const statusTypes = [
      { text: '正常', type: 'success' },
      { text: '警告', type: 'warning' },
      { text: '错误', type: 'error' },
      { text: '信息', type: 'info' }
    ];
    
    // 随机生成一个事件
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const randomStatus = statusTypes[Math.floor(Math.random() * statusTypes.length)];
    
    // 创建新事件
    const newEvent = {
      time: new Date().toISOString(),
      event: randomEvent,
      device: manholes[Math.floor(Math.random() * manholes.length)]?.id || '未知设备',
      deviceName: manholes[Math.floor(Math.random() * manholes.length)]?.name || '未知设备',
      status: randomStatus.text,
      type: randomStatus.type
    };
    
    // 更新事件日志 (保留最近20条)
    setEventLog(prevLogs => [newEvent, ...prevLogs].slice(0, 20));
  }, [manholes]);
  
  // 自动刷新逻辑 - 改为1小时刷新一次
  useEffect(() => {
    if (!autoRefresh) return;
    
    console.log(`设置刷新间隔为 ${refreshInterval} 秒`);
    const intervalId = setInterval(() => {
      console.log("执行定时刷新");
      refreshData();
    }, refreshInterval * 1000); // 转换为毫秒
    
    return () => {
      console.log("清除刷新定时器");
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, refreshData]);
  
  // 首次加载
  useEffect(() => {
    console.log("组件首次加载，执行初始刷新");
    refreshData();
    
    // 初始化一些事件
    for (let i = 0; i < 5; i++) {
      generateEventLog();
    }
    
    // 保存初始刷新的数据
    lastRefreshedDataRef.current = new Map(realTimeDataMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <ErrorBoundary fallback={
      <Card title="实时监控" style={{ margin: '16px 0' }}>
        <Empty description="实时监控组件加载出错，请刷新页面重试" />
      </Card>
    }>
      <div className="real-time-monitoring-container">
        <Card
          title={
            <Space>
              <ClockCircleOutlined /> 实时监控
              <Tooltip title="上次更新时间">
                <Tag>{new Date(dataTimestamp).toLocaleString()}</Tag>
              </Tooltip>
            </Space>
          }
          extra={
            <Space>
              <Select
                value={selectedAreaFilter}
                onChange={setSelectedAreaFilter}
                style={{ width: 120 }}
              >
                <Option value="all">全部区域</Option>
                <Option value="北">北区</Option>
                <Option value="南">南区</Option>
                <Option value="东">东区</Option>
                <Option value="西">西区</Option>
              </Select>
              
              <Select
                value={deviceLimit}
                onChange={setDeviceLimit}
                style={{ width: 120 }}
              >
                <Option value={5}>显示5台设备</Option>
                <Option value={10}>显示10台设备</Option>
                <Option value={20}>显示20台设备</Option>
                <Option value={50}>显示50台设备</Option>
              </Select>

              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={refreshData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Switch 
                checkedChildren="自动刷新" 
                unCheckedChildren="手动刷新" 
                checked={autoRefresh} 
                onChange={setAutoRefresh} 
              />
              <Select 
                value={refreshInterval} 
                onChange={setRefreshInterval}
                disabled={!autoRefresh}
                style={{ width: 120 }}
              >
                <Option value={60}>每分钟</Option>
                <Option value={300}>每5分钟</Option>
                <Option value={900}>每15分钟</Option>
                <Option value={1800}>每30分钟</Option>
                <Option value={3600}>每小时</Option>
              </Select>
            </Space>
          }
        >
          <Spin spinning={loading}>
            <Row gutter={16}>
              <Col span={24}>
                <Alert
                  message="实时监控系统"
                  description={
                    <div>
                      <p>实时监控系统正在运行中，最后更新时间: {new Date(dataTimestamp).toLocaleString()}</p>
                      <p>当前显示 {displayedDevices.length} 台设备，每 {refreshInterval} 秒自动刷新一次</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<DashboardOutlined />}
                  style={{ marginBottom: 16 }}
                />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card 
                  title={
                    <div>
                      <AimOutlined style={{ marginRight: 8 }} />
                      设备状态监控
                    </div>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={[16, 0]}>
                    {displayedDevices.map(renderDeviceStatusPanel)}
                  </Row>
                </Card>
              </Col>
              
              <Col span={12}>
                <ErrorBoundary fallback={
                  <Card title="详细监控" style={{ marginBottom: 16 }}>
                    <Empty description="详细监控数据加载出错" />
                  </Card>
                }>
                  <DetailMonitoringPanel 
                    selectedDevice={selectedManholeId ? (manholes.find(device => device.id === selectedManholeId) || null) : null}
                    chartData={optimizedChartData()}
                  />
                </ErrorBoundary>
              </Col>
            </Row>
          </Spin>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

// 使用React.memo包装整个组件以防止不必要的重渲染
export default React.memo(RealTimeMonitoring); 