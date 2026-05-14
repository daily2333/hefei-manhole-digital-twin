import React, { useEffect, useState } from 'react';
import { Card, Radio, Spin, Empty, Switch, Tooltip, Space } from 'antd';
import { Line } from '@ant-design/charts';
import { predictionService } from '../../services/predictionService';
import { InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';

interface PredictionChartProps {
  manholeId: string;
}

// 定义明确的数据结构
interface ChartDataItem {
  timestamp: string | number; // 可以是时间戳数字或ISO日期字符串
  value: number;
  type: string;
  formattedTime: string;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ manholeId }) => {
  const [dataType, setDataType] = useState<'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'>('temperature');
  const [predictionData, setPredictionData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThresholds, setShowThresholds] = useState(true);
  
  // 数据类型映射
  const dataTypeMap = {
    temperature: { 
      label: '温度', 
      unit: '°C',
      color: '#ff7a45',
      normalRange: [15, 35],
      warningRange: [35, 45],
      criticalRange: [45, 80]
    },
    humidity: { 
      label: '湿度', 
      unit: '%',
      color: '#1890ff',
      normalRange: [20, 60],
      warningRange: [60, 80],
      criticalRange: [80, 100]
    },
    gasConcentration: { 
      label: '气体浓度', 
      unit: 'ppm',
      color: '#52c41a',
      normalRange: [0, 80],
      warningRange: [80, 120],
      criticalRange: [120, 200]
    },
    waterLevel: { 
      label: '水位', 
      unit: '%',
      color: '#2f54eb',
      normalRange: [0, 30],
      warningRange: [30, 60],
      criticalRange: [60, 100]
    },
    batteryLevel: { 
      label: '电池电量', 
      unit: '%',
      color: '#faad14',
      normalRange: [40, 100],
      warningRange: [20, 40],
      criticalRange: [0, 20]
    }
  };
  
  // 创建默认数据函数
  const createDefaultData = () => {
    const now = new Date();
    const data: ChartDataItem[] = [];
    
    // 创建24小时的模拟数据
    for (let i = -12; i < 12; i++) {
      const timestamp = new Date(now.getTime() + i * 3600000).toISOString();
      const isActual = i < 0;
      
      // 根据数据类型生成合理范围的值
      let value: number;
      switch (dataType) {
        case 'temperature':
          value = 20 + Math.sin(i * 0.5) * 5 + Math.random() * 2;
          break;
        case 'humidity':
          value = 50 + Math.sin(i * 0.3) * 15 + Math.random() * 5;
          break;
        case 'gasConcentration':
          value = 40 + Math.sin(i * 0.2) * 30 + Math.random() * 10;
          break;
        case 'waterLevel':
          value = 15 + Math.sin(i * 0.1) * 10 + Math.random() * 5;
          break;
        case 'batteryLevel':
          value = 85 - i * 0.2 + Math.random();
          break;
        default:
          value = 50 + Math.random() * 20;
      }
      
      data.push({
        timestamp,
        value,
        type: isActual ? '实际数据' : '预测数据',
        formattedTime: new Date(timestamp).toLocaleString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric'
        })
      });
    }
    
    return data;
  };
  
  // 组件挂载时生成默认数据
  useEffect(() => {
    // 设置默认数据以确保图表能立即渲染
    setPredictionData(createDefaultData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (manholeId) {
      setLoading(true);
      
      try {
        // 获取预测数据
        const data = predictionService.predictFutureTrend(manholeId, dataType);
        
        // 确保数据非空
        if (data && data.length > 0) {
          // 直接使用ISO字符串格式的日期
          const formattedData = data.map(item => ({
            timestamp: item.timestamp, // 保持原始ISO字符串格式
            value: item.value,
            type: item.isActual ? '实际数据' : '预测数据',
            formattedTime: new Date(item.timestamp).toLocaleString('zh-CN', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric'
            })
          }));
          
          // 简单验证
          if (formattedData.length > 0) {
            console.log('数据获取成功，数据项数量:', formattedData.length);
            // 打印第一项作为示例
            console.log('示例数据项:', formattedData[0]);
            setPredictionData(formattedData);
          } else {
            console.warn('格式化后没有数据');
            setPredictionData([]);
          }
        } else {
          console.warn('预测数据为空');
          setPredictionData([]);
        }
      } catch (error) {
        console.error('获取预测数据出错:', error);
        setPredictionData([]);
      } finally {
        setLoading(false);
      }
    }
  }, [manholeId, dataType]);
  
  // 渲染图表前进行数据预处理
  const processChartData = (data: ChartDataItem[]) => {
    // 创建默认数据
    const createDefaultData = () => {
      const now = Date.now();
      return Array.from({ length: 5 }, (_, i) => ({
        // 确保日期格式正确，使用ISO字符串
        timestamp: new Date(now + i * 3600000).toISOString(),
        value: 20 + Math.random() * 10,
        type: i < 2 ? '实际数据' : '预测数据',
        formattedTime: new Date(now + i * 3600000).toLocaleString('zh-CN')
      }));
    };
    
    if (!data || data.length === 0) {
      console.log('没有可用数据，使用默认数据');
      return createDefaultData();
    }
    
    // 简化数据处理：转换为图表库需要的格式
    try {
      // 格式化数据，使用ISO日期字符串而不是时间戳数字
      const validData = data.map(item => ({
        // 确保使用ISO字符串格式的日期，而不是数字时间戳
        timestamp: new Date(item.timestamp).toISOString(),
        value: item.value,
        type: item.type,
        formattedTime: item.formattedTime
      })).filter(item => {
        const isValid = item.timestamp && !isNaN(new Date(item.timestamp).getTime()) && 
                        typeof item.value === 'number' && !isNaN(item.value);
        if (!isValid) {
          console.warn('过滤掉无效数据项:', item);
        }
        return isValid;
      });
      
      if (validData.length === 0) {
        console.warn('过滤后没有有效数据，使用默认数据');
        return createDefaultData();
      }
      
      // 确保数据按时间排序
      return validData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('数据处理出错:', error);
      return createDefaultData();
    }
  };
  
  // 在图表渲染部分使用处理后的数据
  const renderChart = () => {
    try {
      // 处理数据
      const processedData = processChartData(predictionData);
      
      // 记录数据情况
      console.log("渲染前的数据:", processedData.length, "项");
      
      // 兼容最新的Ant Design Charts配置方式
      return (
        <Line
          data={processedData}
          xField="timestamp"
          yField="value"
          seriesField="type"
          smooth
          animation={{
            appear: {
              duration: 1000,
            },
          }}
          color={({ type }: { type: string }) => {
            return type === '预测数据' ? '#91caff' : dataTypeMap[dataType].color;
          }}
          lineStyle={({ type }: { type: string }) => {
            return {
              lineDash: type === '预测数据' ? [4, 4] : undefined,
              lineWidth: type === '预测数据' ? 2 : 3,
            };
          }}
          point={{
            size: 4,
            style: ({ type }: { type: string }) => {
              return {
                fill: type === '预测数据' ? '#91caff' : dataTypeMap[dataType].color,
              };
            },
          }}
          tooltip={{
            formatter: (datum: any) => {
              return { 
                name: datum.type,
                value: `${datum.value.toFixed(1)} ${dataTypeMap[dataType].unit}`,
              };
            },
          }}
          xAxis={{
            type: 'time',
            label: {
              formatter: (v: string) => {
                try {
                  const date = new Date(v);
                  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
                } catch (e) {
                  return v;
                }
              },
            }
          }}
          yAxis={{
            title: {
              text: `${dataTypeMap[dataType].label} (${dataTypeMap[dataType].unit})`,
            },
            min: Math.min(...processedData.map(d => d.value)) * 0.9,
            max: Math.max(...processedData.map(d => d.value)) * 1.1,
          }}
          legend={{
            position: 'top',
          }}
        />
      );
    } catch (error) {
      console.error("图表渲染错误:", error);
      // 出错时显示一个空的图表
      return (
        <Empty 
          description="图表渲染出错，请检查控制台" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
  };
  
  return (
    <Card 
      className="prediction-chart"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>数据趋势预测分析</span>
          <Space>
            <Tooltip title="显示/隐藏警告和危险阈值">
              <Switch 
                checkedChildren="阈值" 
                unCheckedChildren="阈值" 
                checked={showThresholds} 
                onChange={setShowThresholds}
                size="small"
              />
            </Tooltip>
            <Radio.Group 
              value={dataType} 
              onChange={(e) => setDataType(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="temperature">温度</Radio.Button>
              <Radio.Button value="humidity">湿度</Radio.Button>
              <Radio.Button value="gasConcentration">气体浓度</Radio.Button>
              <Radio.Button value="waterLevel">水位</Radio.Button>
              <Radio.Button value="batteryLevel">电池电量</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
      }
      extra={
        <Tooltip title="基于历史数据和线性回归进行预测分析">
          <InfoCircleOutlined />
        </Tooltip>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="chart-container" style={{ height: 400 }}>
            {renderChart()}
          </div>
          
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
            <BulbOutlined style={{ marginRight: 8, color: '#faad14' }} />
            <span style={{ fontSize: 13, color: '#666' }}>
              预测分析显示未来24小时的数据趋势，虚线表示预测值，实线表示历史实际值
            </span>
          </div>
        </>
      )}
    </Card>
  );
};

export default PredictionChart; 