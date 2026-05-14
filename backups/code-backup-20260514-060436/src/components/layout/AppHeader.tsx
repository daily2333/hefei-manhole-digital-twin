import React from 'react';
import { Layout, Button, Badge } from 'antd';
import { BellOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';
import { SystemStatusPanel } from './SystemStatusPanel';

const { Header } = Layout;

interface AppHeaderProps {
  currentTime: Date;
  notifications: number;
  onClearNotifications: () => void;
}

/**
 * 应用头部组件
 * 包含标题、系统状态和头部控制按钮
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ 
  currentTime, 
  notifications,
  onClearNotifications
}) => {
  return (
    <Header className="header-container">
      <div className="logo-area">
        <div className="city-logo"></div>
        <div className="platform-title">
          <h1>智能井盖中央管理平台</h1>
        </div>
      </div>
      
      <div className="header-controls">
        <SystemStatusPanel currentTime={currentTime} />
        
        <Badge count={notifications} size="small">
          <Button 
            type="text" 
            icon={<BellOutlined />} 
            className="header-icon-button"
            onClick={onClearNotifications}
          />
        </Badge>
        
        <Button 
          type="text" 
          icon={<QuestionCircleOutlined />} 
          className="header-icon-button"
        />
        
        <Button 
          type="text" 
          icon={<UserOutlined />} 
          className="header-icon-button"
        />
      </div>
    </Header>
  );
}; 