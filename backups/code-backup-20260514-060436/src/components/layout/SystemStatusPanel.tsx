import React from 'react';
import { Badge } from 'antd';
import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';

interface SystemStatusPanelProps {
  currentTime: Date;
}

/**
 * 系统状态面板组件
 * 显示当前时间和系统状态
 */
export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ currentTime }) => {
  // 格式化时间为 HH:MM:SS
  const formattedTime = currentTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
  
  return (
    <div className="system-status-panel">
      <div className="time-display">
        <ClockCircleOutlined className="time-icon" /> 
        <span className="time-text">{formattedTime}</span>
      </div>
      <div className="status-indicator">
        <Badge status="processing" text="系统正常运行中" />
        <SyncOutlined spin className="sync-icon" /> 
      </div>
    </div>
  );
}; 