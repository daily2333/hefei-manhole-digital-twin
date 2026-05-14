import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography } from 'antd';
import { ManholeInfo } from '../../typings';
import DeviceStatusChart from '../dashboard/DeviceStatusChart';

const { Title } = Typography;

interface DailyReportProps {
  manholes: ManholeInfo[];
  date?: Date;
  loading?: boolean;
}

/**
 * 日报表组件
 * 展示设备状态分布、告警情况等统计信息
 */
const DailyReport: React.FC<DailyReportProps> = ({ 
  manholes, 
  date = new Date(), 
  loading = false 
}) => {
  // 日期格式化
  const formattedDate = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 区域分组 - 使用对象和数组方法处理
  const regionMap: Record<string, ManholeInfo[]> = {};
  
  // 按区域分组设备
  manholes.forEach(manhole => {
    const district = manhole.location.district;
    if (!regionMap[district]) {
      regionMap[district] = [];
    }
    regionMap[district].push(manhole);
  });
  
  // 转换为数组格式
  const devicesByRegion = Object.keys(regionMap).map(region => ({
    region,
    devices: regionMap[region]
  }));

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="正在加载报表数据..." />
      </div>
    );
  }

  return (
    <div className="daily-report">
      <Title level={4} style={{ textAlign: 'center', marginBottom: '20px' }}>
        {formattedDate} 设备状态日报表
      </Title>
      
      <Row gutter={[16, 16]}>
        {/* 总体设备状态分布 */}
        <Col span={8}>
          <DeviceStatusChart 
            manholes={manholes} 
            title="总体设备状态分布" 
            height={250}
          />
        </Col>
        
        {/* 按区域展示前两个区域的设备状态 */}
        {devicesByRegion.slice(0, 2).map(item => (
          <Col span={8} key={item.region}>
            <DeviceStatusChart 
              manholes={item.devices} 
              title={`${item.region}设备状态分布`} 
              height={250}
            />
          </Col>
        ))}
      </Row>
      
      {/* 可以在这里添加更多的统计图表 */}
    </div>
  );
};

export default DailyReport; 