import React, { useState, useEffect } from 'react'; 
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  Space, 
  Tabs,
  Empty,
  Alert,
  Tooltip
} from 'antd';
import { 
  LineChartOutlined, 
  AreaChartOutlined, 
  BulbOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  BarChartOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { ManholeInfo, ManholeAlarm } from '../../typings'; 
import PredictionChart from '../dashboard/PredictionChart';
import HefeiManholeScene from '../3d-visualization/HefeiManholeScene';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface PredictionAnalyticsProps { 
  manholes?: ManholeInfo[]; 
  alarms?: ManholeAlarm[]; 
}

// 预测分析类型
enum PredictionType {
  TREND = 'trend',
  ANOMALY = 'anomaly',
  FORECAST = 'forecast',
  RISK = 'risk'
}

const PredictionAnalytics: React.FC<PredictionAnalyticsProps> = ({ 
  manholes = [], 
  alarms = [] 
}) => {
  const [selectedManholeId, setSelectedManholeId] = useState<string>('');
  const [predictionType, setPredictionType] = useState<PredictionType>(PredictionType.TREND);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7天后
  ]);

  // 初始化时如果有井盖则选择第一个
  useEffect(() => {
    if (manholes.length > 0 && !selectedManholeId) {
      setSelectedManholeId(manholes[0].id);
    }
  }, [manholes, selectedManholeId]);

  // 处理井盖选择变更
  const handleManholeChange = (value: string) => {
    setSelectedManholeId(value);
  };

  // 处理预测类型变更
  const handlePredictionTypeChange = (key: string) => {
    setPredictionType(key as PredictionType);
  };

  // 渲染3D预测场景
  const render3DPrediction = () => {
    // 创建一个虚拟的实时数据Map
    const realTimeDataMap = new Map();
    
    // 为每个井盖添加一些随机数据
    manholes.forEach(manhole => {
      realTimeDataMap.set(manhole.id, {
        temperature: Math.round(15 + Math.random() * 20),
        waterLevel: Math.round(10 + Math.random() * 90),
        gasConcentration: {
          ch4: Math.round(10 + Math.random() * 90),
          co: Math.round(5 + Math.random() * 15),
          h2s: Math.round(1 + Math.random() * 8),
          o2: Math.round(18 + Math.random() * 3)
        },
        coverStatus: Math.random() > 0.8 ? 1 : 0,
        timestamp: new Date().toISOString()
      });
    });
    
    return (
      <div style={{ height: 'calc(100vh - 300px)', position: 'relative' }}>
        <Alert
          message="预测分析模式"
          description="此模式下显示的是基于历史数据和环境模型预测的未来可能发生的井盖状态变化。红色表示预测会进入告警状态，黄色表示预测会进入警告状态。"
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <HefeiManholeScene
          manholes={manholes}
          realTimeDataMap={realTimeDataMap}
          onSelectManhole={setSelectedManholeId}
          selectedManholeId={selectedManholeId}
          isNightMode={false}
        />
      </div>
    );
  };

  // 渲染趋势预测
  const renderTrendPrediction = () => {
    if (!selectedManholeId) {
      return <Empty description="请选择一个井盖设备" />;
    }
    
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="趋势预测分析"
            description="基于历史数据和环境因素，预测未来一段时间内各项指标的变化趋势。"
            type="info"
            showIcon
            icon={<LineChartOutlined />}
            style={{ marginBottom: '16px' }}
          />
        </Col>
        <Col span={24}>
          <PredictionChart manholeId={selectedManholeId} />
        </Col>
      </Row>
    );
  };

  // 渲染异常检测
  const renderAnomalyDetection = () => {
    if (!selectedManholeId) {
      return <Empty description="请选择一个井盖设备" />;
    }
    
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="异常检测预警"
            description="使用机器学习算法分析历史数据的模式，检测潜在的异常情况并提前预警。"
            type="warning"
            showIcon
            icon={<ThunderboltOutlined />}
            style={{ marginBottom: '16px' }}
          />
        </Col>
        <Col span={24}>
          <Card 
            title="异常检测结果" 
            extra={
              <Tooltip title="基于Z-Score算法，分析数据偏离正常范围的程度">
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            <Empty description="暂无异常数据" />
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染风险预测
  const renderRiskPrediction = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="系统风险预测"
            description="综合各种因素进行风险评估，预测可能的系统故障和设备问题。"
            type="error"
            showIcon
            icon={<RiseOutlined />}
            style={{ marginBottom: '16px' }}
          />
        </Col>
        <Col span={24}>
          {render3DPrediction()}
        </Col>
      </Row>
    );
  };

  // 渲染内容
  const renderContent = () => {
    switch(predictionType) {
      case PredictionType.TREND:
        return renderTrendPrediction();
      case PredictionType.ANOMALY:
        return renderAnomalyDetection();
      case PredictionType.FORECAST:
        return <Empty description="未来预测功能开发中..." />;
      case PredictionType.RISK:
        return renderRiskPrediction();
      default:
        return <Empty description="请选择预测类型" />;
    }
  };

  return (
    <div className="prediction-analytics-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="horizontal" size="large">
              <div>
                <span style={{ marginRight: '8px' }}>选择井盖:</span>
                <Select 
                  value={selectedManholeId} 
                  onChange={handleManholeChange}
                  style={{ width: 200 }}
                  placeholder="请选择井盖"
                >
                  {manholes.map(manhole => (
                    <Option key={manhole.id} value={manhole.id}>{manhole.name}</Option>
                  ))}
                </Select>
              </div>
              
              <div>
                <span style={{ marginRight: '8px' }}>预测周期:</span>
                <RangePicker
                  value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                  onChange={(value) => {
                    if (value?.[0] && value?.[1]) {
                      setDateRange([value[0].toDate(), value[1].toDate()]);
                    }
                  }}
                />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Tabs 
            activeKey={predictionType} 
            onChange={handlePredictionTypeChange}
            type="card"
          >
            <TabPane 
              tab={<span><LineChartOutlined /> 趋势预测</span>} 
              key={PredictionType.TREND}
            />
            <TabPane 
              tab={<span><ThunderboltOutlined /> 异常检测</span>} 
              key={PredictionType.ANOMALY}
            />
            <TabPane 
              tab={<span><AreaChartOutlined /> 未来预测</span>} 
              key={PredictionType.FORECAST}
            />
            <TabPane 
              tab={<span><BarChartOutlined /> 风险预测</span>} 
              key={PredictionType.RISK}
            />
          </Tabs>
          
          {renderContent()}
        </Col>
      </Row>
    </div>
  );
}; 

export default PredictionAnalytics;
