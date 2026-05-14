import React, { useMemo } from 'react';
import { Card, Empty } from 'antd';
import { Pie } from '@ant-design/charts';
import { ManholeStatus, ManholeInfo } from '../../typings';

interface DeviceStatusChartProps {
  manholes: ManholeInfo[];
  title?: string;
  height?: number;
}

/**
 * 设备状态分布图表组件
 * 使用饼图展示不同状态设备的数量分布
 */
const DeviceStatusChart: React.FC<DeviceStatusChartProps> = ({ 
  manholes, 
  title = "设备状态分布", 
  height = 300 
}) => {
  // 计算各状态设备数量
  const chartData = useMemo(() => {
    if (!manholes || manholes.length === 0) {
      return [];
    }

    // 各种状态计数
    const normalCount = manholes.filter(m => m.status === ManholeStatus.Normal).length;
    const warningCount = manholes.filter(m => m.status === ManholeStatus.Warning).length;
    const alarmCount = manholes.filter(m => m.status === ManholeStatus.Alarm).length;
    const maintenanceCount = manholes.filter(m => m.status === ManholeStatus.Maintenance).length;
    const offlineCount = manholes.filter(m => m.status === ManholeStatus.Offline).length;

    return [
      { type: '正常', value: normalCount, color: '#52c41a' },
      { type: '警告', value: warningCount, color: '#faad14' },
      { type: '告警', value: alarmCount, color: '#f5222d' },
      { type: '维护中', value: maintenanceCount, color: '#1890ff' },
      { type: '离线', value: offlineCount, color: '#8c8c8c' },
    ].filter(item => item.value > 0); // 过滤掉数量为0的状态
  }, [manholes]);

  // 如果没有数据，显示空状态
  if (!chartData.length) {
    return (
      <Card title={title}>
        <Empty description="暂无设备数据" />
      </Card>
    );
  }

  // 饼图配置 - 简化版本
  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.5, // 设置为环形图
    // 简化label配置
    label: {
      content: '{name}: {value}',
    },
    // 移除可能引起冲突的interactions配置
    // 使用简单的颜色映射而不是函数
    color: ['#52c41a', '#faad14', '#f5222d', '#1890ff', '#8c8c8c'],
    legend: {
      position: 'bottom',
    },
    // 简化tooltip配置
    tooltip: {
      showTitle: false,
    },
    // 简化statistic配置
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '16px',
        },
        content: `总数\n${manholes.length}`,
      },
    },
  };

  return (
    <Card title={title}>
      <div style={{ height }}>
        <Pie {...config} />
      </div>
    </Card>
  );
};

export default DeviceStatusChart; 