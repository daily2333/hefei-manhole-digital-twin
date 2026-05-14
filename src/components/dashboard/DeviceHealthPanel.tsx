import React, { useEffect, useState } from 'react';
import { Card, Progress, Statistic, Timeline, Divider, Badge, Row, Col, Table, Tooltip, Space } from 'antd';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';
import { predictionService } from '../../services/predictionService';
import { 
  FieldTimeOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltFilled,
  SyncOutlined,
  SafetyCertificateFilled,
  ToolFilled
} from '@ant-design/icons';

interface DeviceHealthPanelProps {
  manholeInfo: ManholeInfo;
  recentData: ManholeRealTimeData[];
}

const DeviceHealthPanel: React.FC<DeviceHealthPanelProps> = ({ 
  manholeInfo,
  recentData
}) => {
  const [healthData, setHealthData] = useState<{
    healthScore: number;
    estimatedLifeRemaining: number;
    recommendations: string[];
  } | null>(null);
  
  const [anomalyData, setAnomalyData] = useState<{
    temperature: { anomalies: any[]; riskLevel: string };
    humidity: { anomalies: any[]; riskLevel: string };
    gasConcentration: { anomalies: any[]; riskLevel: string };
  } | null>(null);
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    if (manholeInfo && recentData.length > 0) {
      setIsRefreshing(true);
      
      // 模拟数据处理延迟
      setTimeout(() => {
        // 获取设备健康数据
        const latestData = recentData[recentData.length - 1] || recentData[0];
        const healthResults = predictionService.predictDeviceHealth(latestData, manholeInfo.status, manholeInfo.installationDate);
        setHealthData(healthResults);
        
        // 获取异常数据
        const temperatureAnomalies = predictionService.detectDataAnomalies(
          manholeInfo.id,
          'temperature'
        );
        
        const humidityAnomalies = predictionService.detectDataAnomalies(
          manholeInfo.id,
          'humidity'
        );
        
        const gasAnomalies = predictionService.detectDataAnomalies(
          manholeInfo.id,
          'gasConcentration'
        );
        
        setAnomalyData({
          temperature: temperatureAnomalies,
          humidity: humidityAnomalies,
          gasConcentration: gasAnomalies
        });
        
        setLastUpdated(new Date());
        setIsRefreshing(false);
      }, 600);
    }
  }, [manholeInfo, recentData]);
  
  // 健康评分颜色
  const getHealthColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };
  
  // 健康评分等级
  const getHealthLevel = (score: number) => {
    if (score >= 80) return '优';
    if (score >= 60) return '良';
    if (score >= 40) return '中';
    return '差';
  };
  
  // 健康分数CSS类
  const getHealthScoreClass = (score: number) => {
    if (score >= 80) return 'highlight-value';
    if (score >= 60) return 'warning-value';
    return 'danger-value';
  };
  
  // 异常风险指示器
  const getRiskIndicator = (level: string) => {
    switch(level) {
      case 'high':
        return <Badge status="error" text={<span className="danger-value">高风险</span>} />;
      case 'medium':
        return <Badge status="warning" text={<span className="warning-value">中风险</span>} />;
      default:
        return <Badge status="success" text={<span style={{color: '#52c41a'}}>低风险</span>} />;
    }
  };
  
  // 获取卡片样式
  const getCardClass = (score: number) => {
    if (score >= 80) return 'data-card';
    if (score >= 60) return 'data-card glow-effect-warning';
    return 'data-card glow-effect-danger';
  };
  
  if (!healthData || !anomalyData) {
    return <Card loading className="data-card" />;
  }
  
  // 计算总体异常风险
  const getOverallRisk = () => {
    const risks = [
      anomalyData.temperature.riskLevel,
      anomalyData.humidity.riskLevel,
      anomalyData.gasConcentration.riskLevel
    ];
    
    if (risks.includes('high')) return '高';
    if (risks.includes('medium')) return '中';
    return '低';
  };
  
  // 获取风险样式
  const getRiskClass = (risk: string) => {
    if (risk === '高') return 'danger-value';
    if (risk === '中') return 'warning-value';
    return 'highlight-value';
  }
  
  // 计算异常数据的总数
  const totalAnomalies = 
    anomalyData.temperature.anomalies.length + 
    anomalyData.humidity.anomalies.length + 
    anomalyData.gasConcentration.anomalies.length;
  
  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <SafetyCertificateFilled style={{ color: getHealthColor(healthData.healthScore) }} />
            <span>设备健康监控</span>
          </Space>
          <Space size="small">
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
              最后更新: {lastUpdated.toLocaleTimeString()}
            </span>
            {isRefreshing && <SyncOutlined spin />}
          </Space>
        </div>
      }
      className={getCardClass(healthData.healthScore)}
      style={{ height: '100%' }}
      variant="borderless"
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <div className="data-panel">
            <Statistic
              title={<div style={{ color: 'rgba(255,255,255,0.85)' }}>设备健康评分</div>}
              value={healthData.healthScore}
              suffix={<span style={{ fontSize: '16px' }}>/ 100 ({getHealthLevel(healthData.healthScore)})</span>}
              valueStyle={{ color: getHealthColor(healthData.healthScore) }}
              className={getHealthScoreClass(healthData.healthScore)}
            />
            <Progress 
              percent={healthData.healthScore} 
              strokeColor={{
                '0%': getHealthColor(healthData.healthScore),
                '100%': healthData.healthScore >= 80 ? '#95de64' : 
                         healthData.healthScore >= 60 ? '#ffc53d' : '#ff7875'
              }}
              showInfo={false}
              strokeWidth={8}
              style={{ marginTop: 15 }}
              trailColor="rgba(255,255,255,0.15)"
            />
            <div style={{ marginTop: 15, display: 'flex', alignItems: 'center' }}>
              <Tooltip title="预计设备剩余使用寿命">
                <FieldTimeOutlined style={{ marginRight: 8, color: '#1677ff' }} /> 
                <span style={{ color: '#1677ff' }}>预计剩余寿命:</span>
                <span style={{ marginLeft: 8 }} className="highlight-value">{healthData.estimatedLifeRemaining}天</span>
              </Tooltip>
            </div>
          </div>
        </Col>
        
        <Col span={8}>
          <div className="data-panel">
            <Statistic
              title={<div style={{ color: 'rgba(255,255,255,0.85)' }}>异常数据点</div>}
              value={totalAnomalies}
              valueStyle={{ 
                color: totalAnomalies > 5 ? '#f5222d' : totalAnomalies > 0 ? '#faad14' : '#52c41a',
                fontSize: '32px'
              }}
              prefix={<ExclamationCircleOutlined />}
              className={totalAnomalies > 5 ? 'danger-value' : totalAnomalies > 0 ? 'warning-value' : 'highlight-value'}
            />
            <div style={{ marginTop: 15 }}>
              <div style={{ marginBottom: 8 }}>
                <ThunderboltFilled style={{ color: '#ff7a45', marginRight: 8 }} />
                <span>温度异常: </span>
                <span style={{ fontWeight: 'bold' }}>{anomalyData.temperature.anomalies.length}个</span>
                <span style={{ marginLeft: 8 }}>{getRiskIndicator(anomalyData.temperature.riskLevel)}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <ThunderboltFilled style={{ color: '#1890ff', marginRight: 8 }} />
                <span>湿度异常: </span>
                <span style={{ fontWeight: 'bold' }}>{anomalyData.humidity.anomalies.length}个</span>
                <span style={{ marginLeft: 8 }}>{getRiskIndicator(anomalyData.humidity.riskLevel)}</span>
              </div>
              <div>
                <ThunderboltFilled style={{ color: '#52c41a', marginRight: 8 }} />
                <span>气体浓度异常: </span>
                <span style={{ fontWeight: 'bold' }}>{anomalyData.gasConcentration.anomalies.length}个</span>
                <span style={{ marginLeft: 8 }}>{getRiskIndicator(anomalyData.gasConcentration.riskLevel)}</span>
              </div>
            </div>
          </div>
        </Col>
        
        <Col span={8}>
          <div className="data-panel">
            <Statistic
              title={<div style={{ color: 'rgba(255,255,255,0.85)' }}>综合风险评估</div>}
              value={getOverallRisk()}
              valueStyle={{ 
                fontSize: '32px',
                fontWeight: 'bold'
              }}
              prefix={<WarningOutlined />}
              className={getRiskClass(getOverallRisk())}
            />
            <div style={{ marginTop: 15 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Tooltip title="安装时间">
                    <Statistic 
                      title={<div style={{ color: 'rgba(255,255,255,0.65)' }}>使用时间</div>} 
                      value={manholeInfo.installationDate.substring(0, 10)} 
                      valueStyle={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}
                    />
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip title="最近一次维护时间">
                    <Statistic 
                      title={<div style={{ color: 'rgba(255,255,255,0.65)' }}>最近维护</div>} 
                      value={manholeInfo.lastMaintenanceTime?.substring(0, 10) || '暂无记录'} 
                      valueStyle={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}
                    />
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip title="设备型号">
                    <Statistic 
                      title={<div style={{ color: 'rgba(255,255,255,0.65)' }}>设备型号</div>} 
                      value={manholeInfo.model} 
                      valueStyle={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}
                    />
                  </Tooltip>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>
      
      <Divider orientation="left" style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.2)' }}>
        <Space>
          <ToolFilled />
          <span>维护建议</span>
        </Space>
      </Divider>
      
      <div className="data-panel" style={{ marginBottom: 16 }}>
        <Timeline>
          {healthData.recommendations.map((recommendation, index) => (
            <Timeline.Item 
              key={index}
              color={
                recommendation.includes('立即') ? 'red' : 
                recommendation.includes('建议') ? 'orange' : 'green'
              }
              dot={
                recommendation.includes('立即') ? <WarningOutlined className="danger-value" style={{ fontSize: '16px' }} /> : 
                recommendation.includes('建议') ? <ExclamationCircleOutlined className="warning-value" style={{ fontSize: '16px' }} /> : 
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              }
            >
              <span style={{ 
                color: recommendation.includes('立即') ? '#ff7875' : 
                       recommendation.includes('建议') ? '#ffc53d' : 'rgba(255,255,255,0.85)'
              }}>
                {recommendation}
              </span>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
      
      {(anomalyData.temperature.anomalies.length > 0 || 
        anomalyData.humidity.anomalies.length > 0 || 
        anomalyData.gasConcentration.anomalies.length > 0) && (
        <>
          <Divider orientation="left" style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <Space>
              <ExclamationCircleOutlined />
              <span>最近异常数据</span>
            </Space>
          </Divider>
          
          <div className="data-panel">
            <Table 
              size="small"
              pagination={false}
              className="glass-border"
              dataSource={[
                ...anomalyData.temperature.anomalies.map(a => ({
                  ...a,
                  type: '温度',
                  key: `temp-${a.timestamp}`
                })),
                ...anomalyData.humidity.anomalies.map(a => ({
                  ...a,
                  type: '湿度',
                  key: `hum-${a.timestamp}`
                })),
                ...anomalyData.gasConcentration.anomalies.map(a => ({
                  ...a,
                  type: '气体浓度',
                  key: `gas-${a.timestamp}`
                }))
              ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)}
              columns={[
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  render: (text) => {
                    const color = 
                      text === '温度' ? '#ff7a45' : 
                      text === '湿度' ? '#1890ff' : '#52c41a';
                    return <Badge color={color} text={text} />;
                  }
                },
                {
                  title: '时间',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (text) => new Date(text).toLocaleString()
                },
                {
                  title: '数值',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value, record: any) => {
                    const absScore = Math.abs(record.zScore);
                    const textClass = absScore > 3 ? 'danger-value' : 
                                  absScore > 2.5 ? 'warning-value' : '';
                    return <span className={textClass}>{value}</span>;
                  }
                },
                {
                  title: '异常程度',
                  dataIndex: 'zScore',
                  key: 'zScore',
                  render: (score) => {
                    const absScore = Math.abs(score);
                    return (
                      <Tooltip title={`Z-score: ${score.toFixed(2)}`}>
                        <Progress 
                          percent={Math.min(100, absScore * 20)} 
                          size="small"
                          strokeColor={{
                            '0%': absScore > 3 ? '#ff4d4f' : 
                                 absScore > 2.5 ? '#ffa940' : '#fadb14',
                            '100%': absScore > 3 ? '#f5222d' : 
                                  absScore > 2.5 ? '#fa8c16' : '#faad14'
                          }}
                          trailColor="rgba(255,255,255,0.15)"
                        />
                      </Tooltip>
                    );
                  }
                }
              ]}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default DeviceHealthPanel; 
