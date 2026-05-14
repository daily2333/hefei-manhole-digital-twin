import React, { useEffect, useState, useMemo } from 'react';
import { Line } from '@ant-design/charts';
import { Card, Row, Col, Space, Typography, Spin, theme } from 'antd';
import { predictionService } from '../../services/predictionService';
const { useToken } = theme;

// 环境数据类型定义
export interface EnvironmentRecord {
  timestamp: number;
  temperature: number;
  humidity: number;
}

// 图表数据点类型
interface DataPoint {
  date: number;
  value: number;
  type: string;
}

// 将环境记录转换为图表格式数据
const transformDataForChart = (data: EnvironmentRecord[], 
                               field: 'temperature' | 'humidity'): DataPoint[] => {
  const currentData = data.map(record => ({
    date: record.timestamp,
    value: record[field],
    type: '当前值'
  }));

  // ... existing code ...

  return currentData;
};

const TemperatureTrendChart: React.FC<{ data: EnvironmentRecord[] }> = ({ data }) => {
  const { token: theme } = useToken();
  
  // 处理数据格式转换为图表所需格式
  const chartData = useMemo(() => {
    return transformDataForChart(data, 'temperature');
  }, [data]);

  return (
    <Card 
      title="温度趋势" 
      bordered={false} 
      style={{ 
        height: '100%',
        borderRadius: theme.borderRadius,
        boxShadow: theme.boxShadow,
      }}
    >
      <Line
        data={chartData}
        xField="date"
        yField="value"
        seriesField="type"
        smooth
        annotations={[
          // 温度预警线
          {
            type: 'line',
            start: ['min', 40],
            end: ['max', 40],
            style: {
              stroke: '#faad14',
              lineDash: [4, 4],
            }
          },
          {
            type: 'text',
            position: ['min', 40],
            content: '温度预警值',
            offsetY: -5,
            style: {
              textAlign: 'left',
              fontSize: 10,
              fill: '#faad14',
            }
          },
          // 温度报警线
          {
            type: 'line',
            start: ['min', 50],
            end: ['max', 50],
            style: {
              stroke: '#f5222d',
              lineDash: [4, 4],
            }
          },
          {
            type: 'text',
            position: ['min', 50],
            content: '温度报警值',
            offsetY: -5,
            style: {
              textAlign: 'left',
              fontSize: 10,
              fill: '#f5222d',
            }
          }
        ]}
        xAxis={{
          title: {
            text: '时间',
          },
          tickCount: 5,
          label: {
            formatter: (v: number | string) => {
              const date = new Date(v);
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
          }
        }}
        yAxis={{
          title: {
            text: '温度 (°C)',
          },
          tickCount: 5,
        }}
        meta={{
          date: {
            formatter: (v: number | string) => {
              const date = new Date(v);
              return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
          },
          value: {
            formatter: (v: number) => `${v} °C`,
          },
        }}
        tooltip={{
          formatter: (datum: any) => {
            return { name: datum.type, value: `${datum.value} °C` };
          },
        }}
        color={['#ff7a45', '#ffa940']}
        legend={{
          position: 'top-right',
        }}
      />
    </Card>
  );
};

const HumidityTrendChart: React.FC<{ data: EnvironmentRecord[] }> = ({ data }) => {
  const { token: theme } = useToken();
  
  // 处理数据格式转换为图表所需格式
  const chartData = useMemo(() => {
    return transformDataForChart(data, 'humidity');
  }, [data]);

  return (
    <Card 
      title="湿度趋势" 
      bordered={false} 
      style={{ 
        height: '100%',
        borderRadius: theme.borderRadius,
        boxShadow: theme.boxShadow,
      }}
    >
      <Line
        data={chartData}
        xField="date"
        yField="value"
        seriesField="type"
        smooth
        annotations={[
          // 湿度预警线
          {
            type: 'line',
            start: ['min', 80],
            end: ['max', 80],
            style: {
              stroke: '#faad14',
              lineDash: [4, 4],
            }
          },
          {
            type: 'text',
            position: ['min', 80],
            content: '湿度预警值',
            offsetY: -5,
            style: {
              textAlign: 'left',
              fontSize: 10,
              fill: '#faad14',
            }
          },
          // 湿度报警线
          {
            type: 'line',
            start: ['min', 90],
            end: ['max', 90],
            style: {
              stroke: '#f5222d',
              lineDash: [4, 4],
            }
          },
          {
            type: 'text',
            position: ['min', 90],
            content: '湿度报警值',
            offsetY: -5,
            style: {
              textAlign: 'left',
              fontSize: 10,
              fill: '#f5222d',
            }
          }
        ]}
        xAxis={{
          title: {
            text: '时间',
          },
          tickCount: 5,
          label: {
            formatter: (v: number | string) => {
              const date = new Date(v);
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
          }
        }}
        yAxis={{
          title: {
            text: '湿度 (%)',
          },
          tickCount: 5,
        }}
        meta={{
          date: {
            formatter: (v: number | string) => {
              const date = new Date(v);
              return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
          },
          value: {
            formatter: (v: number) => `${v}%`,
          },
        }}
        tooltip={{
          formatter: (datum: any) => {
            return { name: datum.type, value: `${datum.value}%` };
          },
        }}
        color={['#1890ff', '#69c0ff']}
        legend={{
          position: 'top-right',
        }}
      />
    </Card>
  );
}; 