import React from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
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
  const { darkAlgorithm } = theme;
  
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#041527',
          colorTextBase: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 6,
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(13, 28, 50, 0.6)',
            borderRadiusLG: 8,
          },
          Menu: {
            colorItemBg: 'transparent',
            colorItemText: 'rgba(255, 255, 255, 0.65)',
            colorItemTextSelected: '#1890ff',
            colorItemBgSelected: 'rgba(24, 144, 255, 0.1)',
          },
          Layout: {
            headerBg: 'rgba(0, 20, 40, 0.7)',
            bodyBg: 'transparent',
          },
          Table: {
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            headerBg: 'rgba(0, 30, 60, 0.6)',
          },
          Button: {
            controlHeight: 36,
          },
          Form: {
            colorTextLabel: "rgba(255, 255, 255, 0.85)",
            colorText: "rgba(255, 255, 255, 0.95)"
          },
          Input: {
            colorText: "rgba(255, 255, 255, 0.95)",
            colorBgContainer: "rgba(0, 20, 40, 0.5)",
            colorBorder: "rgba(100, 150, 200, 0.2)"
          },
          Select: {
            colorText: "rgba(255, 255, 255, 0.95)",
            colorBgContainer: "rgba(0, 20, 40, 0.5)",
            colorTextPlaceholder: "rgba(255, 255, 255, 0.45)",
            colorBorder: "rgba(100, 150, 200, 0.2)"
          },
          DatePicker: {
            colorText: "rgba(255, 255, 255, 0.95)",
            colorBgContainer: "rgba(0, 20, 40, 0.5)",
            colorTextPlaceholder: "rgba(255, 255, 255, 0.45)",
            colorBorder: "rgba(100, 150, 200, 0.2)"
          },
          Modal: {
            colorText: "rgba(255, 255, 255, 0.95)",
            colorBgElevated: "rgba(13, 28, 50, 0.95)"
          },
        },
      }}
    >
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
    </ConfigProvider>
  );
}; 
