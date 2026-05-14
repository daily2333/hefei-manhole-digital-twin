import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Button, 
  DatePicker, 
  Space, 
  Statistic, 
  Tabs, 
  Divider
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DotChartOutlined,
} from '@ant-design/icons';
import { ManholeInfo, ManholeAlarm } from '../../typings';
import Chart from '../common/Chart';
import type { ChartData } from '../common/Chart';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 分析类型枚举
enum AnalysisType {
  TREND = 'trend',
  DISTRIBUTION = 'distribution',
  CORRELATION = 'correlation',
  ANOMALY = 'anomaly',
  COMPARISON = 'comparison'
}

// 数据类型枚举
const DATA_TYPES = [
  { value: 'alarm', label: '告警数据' },
  { value: 'status', label: '状态数据' },
  { value: 'battery', label: '电池数据' },
  { value: 'water', label: '水位数据' },
  { value: 'gas', label: '气体浓度数据' },
  { value: 'temperature', label: '温度数据' }
];

interface DataAnalyticsProps {
  manholes?: ManholeInfo[];
  alarms?: ManholeAlarm[];
}

/**
 * 数据分析组件
 */
const DataAnalytics: React.FC<DataAnalyticsProps> = ({
  manholes = [],
  alarms = []
}) => {
  // 状态定义
  const [, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.TREND);
  const [dataType, setDataType] = useState<string>('alarm');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    new Date()
  ]);
  const [chartData, setChartData] = useState<ChartData>({
    title: '',
    points: []
  });
  
  // 各类分析数据
  const [trendData, setTrendData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  
  // 生成测试分析数据
  const generateAnalysisData = () => {
    setLoading(true);
    
    // 生成趋势数据 - 按日期的值变化
    const trendDataPoints = generateTrendData();
    setTrendData(trendDataPoints);
    
    // 生成分布数据 - 不同区域分布
    const distributionDataPoints = generateDistributionData();
    setDistributionData(distributionDataPoints);
    
    // 生成相关性数据
    const correlationDataPoints = generateCorrelationData();
    setCorrelationData(correlationDataPoints);
    
    // 生成异常检测数据
    const anomalyDataPoints = generateAnomalyData();
    setAnomalyData(anomalyDataPoints);
    
    // 生成比较数据
    const comparisonDataPoints = generateComparisonData();
    setComparisonData(comparisonDataPoints);
    
    setLoading(false);
  };
  
  // 生成趋势数据
  const generateTrendData = () => {
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // 生成每天的数据点
    const data = [];
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // 根据数据类型生成不同范围和趋势的值
      let value = 0;
      let baseValue = 0;
      const noise = Math.random() * 10 - 5; // 随机噪声
      
      switch(dataType) {
        case 'alarm':
          // 告警数据，5-25，有周期性
          baseValue = 15 + 10 * Math.sin(i / 7 * Math.PI);
          value = Math.max(0, Math.round(baseValue + noise));
          break;
        case 'status':
          // 状态数值，0-100
          baseValue = 75 + 5 * Math.sin(i / 10 * Math.PI);
          value = Math.max(0, Math.min(100, Math.round(baseValue + noise)));
          break;
        case 'battery':
          // 电池，逐渐下降，70-100
          baseValue = 100 - (i / days) * 30;
          value = Math.max(70, Math.min(100, Math.round(baseValue + noise / 2)));
          break;
        case 'water':
          // 水位，0-100，有随机波动
          baseValue = 30 + 20 * Math.sin(i / 5 * Math.PI);
          value = Math.max(0, Math.min(100, Math.round(baseValue + noise * 2)));
          break;
        case 'gas':
          // 气体，0-50，有随机峰值
          baseValue = 10 + 5 * Math.sin(i / 3 * Math.PI);
          // 随机峰值
          if (Math.random() < 0.05) {
            baseValue += 30;
          }
          value = Math.max(0, Math.round(baseValue + noise));
          break;
        case 'temperature':
          // 温度，10-40
          baseValue = 25 + 10 * Math.sin(i / 30 * Math.PI * 2); // 季节变化
          value = Math.max(10, Math.min(40, Math.round(baseValue + noise / 2)));
          break;
        default:
          value = Math.round(Math.random() * 100);
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value
      });
    }
    
    return data;
  };
  
  // 生成分布数据
  const generateDistributionData = () => {
    const areas = ['北区', '南区', '东区', '西区', '中心区'];
    const data = [];
    
    for (const area of areas) {
      // 根据数据类型生成不同的值
      let value = 0;
      
      switch(dataType) {
        case 'alarm':
          value = Math.round(Math.random() * 50 + 10);
          break;
        case 'status':
          value = Math.round(Math.random() * 40 + 60); // 60-100
          break;
        case 'battery':
          value = Math.round(Math.random() * 20 + 80); // 80-100
          break;
        case 'water':
          value = Math.round(Math.random() * 70 + 10); // 10-80
          break;
        case 'gas':
          value = Math.round(Math.random() * 30 + 5); // 5-35
          break;
        case 'temperature':
          value = Math.round(Math.random() * 20 + 15); // 15-35
          break;
        default:
          value = Math.round(Math.random() * 100);
      }
      
      data.push({
        name: area,
        value: value
      });
    }
    
    return data;
  };
  
  // 生成相关性数据
  const generateCorrelationData = () => {
    // 不同指标的相关性数据
    const metrics = [
      { name: '温度', correlation: Math.random() * 0.8 - 0.4 },
      { name: '湿度', correlation: Math.random() * 0.8 - 0.4 },
      { name: '水位', correlation: Math.random() * 0.8 - 0.4 },
      { name: '气体浓度', correlation: Math.random() * 0.8 - 0.4 },
      { name: '电池电量', correlation: Math.random() * 0.8 - 0.4 },
      { name: '信号强度', correlation: Math.random() * 0.8 - 0.4 }
    ];
    
    return metrics.map((item) => ({
      name: item.name,
      value: parseFloat(item.correlation.toFixed(2))
    }));
  };
  
  // 生成异常检测数据
  const generateAnomalyData = () => {
    const days = 60; // 最近60天
    const endDate = new Date();
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(endDate.getDate() - (days - i));
      
      // 生成正常值
      let baseValue = 0;
      let anomaly = false;
      
      switch(dataType) {
        case 'alarm':
          baseValue = 15 + 5 * Math.sin(i / 7 * Math.PI);
          break;
        case 'status':
          baseValue = 80 + 10 * Math.sin(i / 10 * Math.PI);
          break;
        case 'battery':
          baseValue = 95 - (i / days) * 15;
          break;
        case 'water':
          baseValue = 30 + 15 * Math.sin(i / 5 * Math.PI);
          break;
        case 'gas':
          baseValue = 15 + 5 * Math.sin(i / 3 * Math.PI);
          break;
        case 'temperature':
          baseValue = 25 + 8 * Math.sin(i / 30 * Math.PI * 2);
          break;
        default:
          baseValue = 50 + 20 * Math.sin(i / 10 * Math.PI);
      }
      
      // 添加随机噪声
      let noise = Math.random() * 6 - 3;
      
      // 随机生成异常值
      if (Math.random() < 0.08) { // 8%的几率出现异常值
        noise = (Math.random() > 0.5 ? 1 : -1) * Math.random() * 30 + 15;
        anomaly = true;
      }
      
      const value = Math.max(0, Math.round(baseValue + noise));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value,
        isAnomaly: anomaly
      });
    }
    
    return data;
  };
  
  // 生成比较数据
  const generateComparisonData = () => {
    const areas = ['北区', '南区', '东区', '西区', '中心区'];
    const metrics = dataType === 'alarm' 
      ? ['告警数', '已处理', '未处理', '平均响应时间']
      : ['设备数', '在线率', '平均水位', '平均温度'];
    const data = [];
    
    for (const area of areas) {
      const item: any = { area };
      
      metrics.forEach(metric => {
        switch(metric) {
          case '告警数':
            item[metric] = Math.round(Math.random() * 100 + 10);
            break;
          case '已处理':
            item[metric] = Math.round(Math.random() * 80 + 5);
            break;
          case '未处理':
            item[metric] = Math.round(Math.random() * 20 + 1);
            break;
          case '平均响应时间':
            item[metric] = Math.round(Math.random() * 120 + 30);
            break;
          case '设备数':
            item[metric] = Math.round(Math.random() * 50 + 20);
            break;
          case '在线率':
            item[metric] = Math.round(Math.random() * 20 + 80);
            break;
          case '平均水位':
            item[metric] = Math.round(Math.random() * 50 + 20);
            break;
          case '平均温度':
            item[metric] = Math.round(Math.random() * 15 + 20);
            break;
          default:
            item[metric] = Math.round(Math.random() * 100);
        }
      });
      
      data.push(item);
    }
    
    return data;
  };
  
  // 更新当前选择的图表数据
  const updateChartData = () => {
    let data: ChartData = {
      title: '',
      points: []
    };
    
    switch(analysisType) {
      case AnalysisType.TREND:
        data = {
          title: `${getDataTypeLabel(dataType)}趋势分析`,
          points: trendData
        };
        break;
      case AnalysisType.DISTRIBUTION:
        data = {
          title: `${getDataTypeLabel(dataType)}分布分析`,
          points: distributionData
        };
        break;
      case AnalysisType.CORRELATION:
        data = {
          title: `${getDataTypeLabel(dataType)}相关性分析`,
          points: correlationData
        };
        break;
      case AnalysisType.ANOMALY:
        data = {
          title: `${getDataTypeLabel(dataType)}异常检测`,
          points: anomalyData
        };
        break;
      case AnalysisType.COMPARISON:
        data = {
          title: `${getDataTypeLabel(dataType)}对比分析`,
          points: comparisonData
        };
        break;
    }
    
    setChartData(data);
  };
  
  // 获取数据类型标签
  const getDataTypeLabel = (type: string): string => {
    switch(type) {
      case 'alarm':
        return '告警';
      case 'status':
        return '状态';
      case 'battery':
        return '电池';
      case 'water':
        return '水位';
      case 'gas':
        return '气体浓度';
      case 'temperature':
        return '温度';
      default:
        return '数据';
    }
  };
  
  // 处理分析类型变更
  const handleAnalysisTypeChange = (type: AnalysisType) => {
    setAnalysisType(type);
  };
  
  // 处理数据类型变更
  const handleDataTypeChange = (type: string) => {
    setDataType(type);
  };
  
  // 处理日期范围变更
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0].toDate(), dates[1].toDate()]);
    }
  };
  
  // 导出分析结果
  const handleExport = () => {
    console.log('导出分析结果', chartData);
    // 在实际应用中这里会调用导出API
  };
  
  // 刷新数据
  const handleRefresh = () => {
    generateAnalysisData();
  };
  
  // 初始加载数据
  useEffect(() => {
    generateAnalysisData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataType, dateRange]);
  
  // 更新图表数据
  useEffect(() => {
    updateChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisType, trendData, distributionData, correlationData, anomalyData, comparisonData]);
  
  // 计算相关统计数据
  const getStatisticsForTab = () => {
    switch (analysisType) {
      case AnalysisType.TREND:
        // 趋势数据的统计
        return {
          count: trendData.length,
          average: trendData.length > 0 
            ? (trendData.reduce((sum, item) => sum + item.value, 0) / trendData.length).toFixed(2)
            : 0,
          max: trendData.length > 0
            ? Math.max(...trendData.map(item => item.value)).toFixed(2)
            : 0,
          min: trendData.length > 0
            ? Math.min(...trendData.map(item => item.value)).toFixed(2)
            : 0
        };
      case AnalysisType.DISTRIBUTION:
        // 分布数据的统计
        return {
          count: distributionData.length,
          total: distributionData.length > 0
            ? distributionData.reduce((sum, item) => sum + item.value, 0)
            : 0,
          average: distributionData.length > 0
            ? (distributionData.reduce((sum, item) => sum + item.value, 0) / distributionData.length).toFixed(2)
            : 0,
          max: distributionData.length > 0
            ? Math.max(...distributionData.map(item => item.value)).toFixed(2)
            : 0
        };
      case AnalysisType.CORRELATION:
        // 相关性数据的统计
        const positiveCount = correlationData.filter(item => item.value > 0).length;
        const negativeCount = correlationData.filter(item => item.value < 0).length;
        return {
          count: correlationData.length,
          positive: positiveCount,
          negative: negativeCount,
          neutral: correlationData.length - positiveCount - negativeCount
        };
      case AnalysisType.ANOMALY:
        // 异常数据的统计
        const anomalyCount = anomalyData.filter(item => item.isAnomaly).length;
        return {
          count: anomalyData.length,
          anomalyCount: anomalyCount,
          anomalyRate: anomalyData.length > 0 
            ? ((anomalyCount / anomalyData.length) * 100).toFixed(2)
            : 0
        };
      case AnalysisType.COMPARISON:
        // 对比数据的统计
        return {
          count: comparisonData.length,
          metrics: comparisonData.length > 0 
            ? Object.keys(comparisonData[0]).filter(key => key !== 'area').length 
            : 0
        };
      default:
        return {};
    }
  };
  
  const stats = getStatisticsForTab();
  
  return (
    <div className="data-analytics-container">
      <Card 
        title={<><BarChartOutlined /> 数据分析</>}
        extra={
          <Space>
            <Select 
              value={dataType}
              onChange={handleDataTypeChange}
              style={{ width: 150 }}
            >
              {DATA_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
            
            <RangePicker 
              onChange={handleDateRangeChange}
              allowClear={false}
            />
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
            
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={analysisType}
          onChange={handleAnalysisTypeChange as any}
          items={[
            {
              label: <span><LineChartOutlined /> 趋势分析</span>,
              key: AnalysisType.TREND,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="line" data={chartData} height={350} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="数据摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic 
                        title="数据点数量" 
                        value={stats.count || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="平均值" 
                        value={stats.average || 0} 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="最大值" 
                        value={stats.max || 0} 
                        valueStyle={{ color: '#cf1322' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="最小值" 
                        value={stats.min || 0} 
                        valueStyle={{ color: '#3f8600' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <p>
                        <InfoCircleOutlined /> 趋势分析展示了{getDataTypeLabel(dataType)}数据随时间的变化趋势
                      </p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><PieChartOutlined /> 分布分析</span>,
              key: AnalysisType.DISTRIBUTION,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="pie" data={chartData} height={350} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="分布摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic 
                        title="区域数量" 
                        value={stats.count || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="总{getDataTypeLabel(dataType)}量" 
                        value={stats.total || 0} 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="平均值" 
                        value={stats.average || 0} 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="最大值" 
                        value={stats.max || 0} 
                        valueStyle={{ color: '#cf1322' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <p>
                        <InfoCircleOutlined /> 分布分析展示了不同区域的{getDataTypeLabel(dataType)}数据分布情况
                      </p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><DotChartOutlined /> 相关性分析</span>,
              key: AnalysisType.CORRELATION,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="bar" data={chartData} height={350} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="相关性摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic 
                        title="指标数量" 
                        value={stats.count || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="正相关" 
                        value={stats.positive || 0} 
                        suffix="个" 
                        valueStyle={{ color: '#3f8600' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="负相关" 
                        value={stats.negative || 0} 
                        suffix="个" 
                        valueStyle={{ color: '#cf1322' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="无明显相关" 
                        value={stats.neutral || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <p>
                        <InfoCircleOutlined /> 相关性分析展示了{getDataTypeLabel(dataType)}数据与其他指标的相关性
                      </p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><LineChartOutlined /> 异常检测</span>,
              key: AnalysisType.ANOMALY,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="line" data={chartData} height={350} options={{
                        series: [{
                          name: '数据点',
                          type: 'line',
                          data: anomalyData.map(item => [item.date, item.value]),
                          markPoint: {
                            data: anomalyData.filter(item => item.isAnomaly).map(item => ({
                              name: '异常点',
                              value: item.value,
                              xAxis: item.date,
                              yAxis: item.value,
                              itemStyle: {
                                color: '#ff4d4f'
                              }
                            }))
                          }
                        }]
                      }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="异常检测摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic 
                        title="数据点数量" 
                        value={stats.count || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="异常点数量" 
                        value={stats.anomalyCount || 0} 
                        suffix="个" 
                        valueStyle={{ color: '#cf1322' }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="异常率" 
                        value={stats.anomalyRate || 0} 
                        suffix="%" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <p>
                        <InfoCircleOutlined /> 异常检测分析展示了{getDataTypeLabel(dataType)}数据中的异常点
                      </p>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              label: <span><BarChartOutlined /> 对比分析</span>,
              key: AnalysisType.COMPARISON,
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={18}>
                    <Card title={chartData.title} bodyStyle={{ height: 400 }}>
                      <Chart type="bar" data={chartData} height={350} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card title="对比摘要" bodyStyle={{ height: 400, overflow: 'auto' }}>
                      <Statistic 
                        title="区域数量" 
                        value={stats.count || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Statistic 
                        title="指标数量" 
                        value={stats.metrics || 0} 
                        suffix="个" 
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      
                      {comparisonData.length > 0 && Object.keys(comparisonData[0])
                        .filter(key => key !== 'area')
                        .map((category, index) => (
                          <React.Fragment key={index}>
                            <Statistic 
                              title={`${category}平均值`} 
                              value={
                                (comparisonData.reduce((sum, item) => sum + item[category], 0) / 
                                comparisonData.length).toFixed(2)
                              } 
                            />
                            <Divider style={{ margin: '12px 0' }} />
                          </React.Fragment>
                        ))
                      }
                      
                      <p>
                        <InfoCircleOutlined /> 对比分析展示了不同区域{getDataTypeLabel(dataType)}数据的对比情况
                      </p>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DataAnalytics; 