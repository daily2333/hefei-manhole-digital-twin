import React from 'react';
import { Badge, Space, Tag } from 'antd';
import { ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

interface SystemStatusPanelProps {
  currentTime: Date;
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ currentTime }) => {
  const time = currentTime.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const date = currentTime.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="status-cluster">
      <div className="status-clock">
        <ClockCircleOutlined />
        <div>
          <div className="status-clock-time">{time}</div>
          <div className="status-clock-date">{date}</div>
        </div>
      </div>
      <Space size={8} wrap>
        <Tag className="status-tag live-tag" bordered={false} icon={<ThunderboltOutlined />}>
          实时流
        </Tag>
        <Tag className="status-tag" bordered={false}>
          <Badge status="processing" />
          系统正常
        </Tag>
      </Space>
    </div>
  );
};
