import React from 'react';
import { Layout } from 'antd';
import { AppHeader } from './AppHeader';
import { ErrorBoundary } from './ErrorBoundary';

const { Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  currentTime: Date;
  notifications: number;
  onClearNotifications: () => void;
  isFullscreen: boolean;
  toggleFullScreen: () => void;
}

/**
 * 应用布局组件
 * 提供应用的整体布局结构
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTime,
  notifications,
  onClearNotifications,
  isFullscreen,
  toggleFullScreen
}) => {
  
  return (
    <Layout className="digital-twin-layout">
        {/* 高级背景效果 */}
        <div className="cyber-background">
          <div className="grid-overlay"></div>
          <div className="glow-effect"></div>
          <div className="cyber-gradient"></div>
          <div className="particles"></div>
        </div>
        
        {/* 头部 */}
        <AppHeader 
          currentTime={currentTime}
          notifications={notifications}
          onClearNotifications={onClearNotifications}
        />
        
        {/* 内容区 */}
        <Content className="main-container">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Content>
        
        {/* 底部 */}
        <Footer className="footer-container">
          <div className="footer-content">
            智慧井盖中央管理平台 ©{new Date().getFullYear()} 城市基础设施管理中心
          </div>
        </Footer>
      </Layout>
  );
}; 
