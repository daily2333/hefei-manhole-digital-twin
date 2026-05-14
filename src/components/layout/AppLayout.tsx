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
      <div className="experience-backdrop" aria-hidden="true">
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="grid-plane" />
        <div className="noise-layer" />
      </div>

      <AppHeader
        currentTime={currentTime}
        notifications={notifications}
        onClearNotifications={onClearNotifications}
        isFullscreen={isFullscreen}
        toggleFullScreen={toggleFullScreen}
      />

      <Content className="main-container">
        <ErrorBoundary>{children}</ErrorBoundary>
      </Content>

      <Footer className="footer-container">
        <div className="footer-content">
          城市基础设施数字孪生控制台
          <span>Hefei Urban Operations Center</span>
        </div>
      </Footer>
    </Layout>
  );
};
