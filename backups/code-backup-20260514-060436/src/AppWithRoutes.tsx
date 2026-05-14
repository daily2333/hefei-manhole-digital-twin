import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Button, ConfigProvider, theme } from 'antd';
import App from './App';
import HefeiMapPage from './pages/HefeiMapPage';

/**
 * 带路由的应用入口
 */
const AppWithRoutes: React.FC = () => {
  const { darkAlgorithm } = theme;

  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#041527',
          colorTextBase: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 6,
        },
        components: {
          Card: {
            colorTextHeading: 'rgba(255, 255, 255, 0.95)',
            colorTextDescription: 'rgba(255, 255, 255, 0.85)',
          },
          Statistic: {
            colorTextDescription: 'rgba(255, 255, 255, 0.85)',
          },
          Table: {
            colorText: 'rgba(255, 255, 255, 0.9)',
          },
          Tabs: {
            colorText: 'rgba(255, 255, 255, 0.9)',
          }
        }
      }}
    >
      <Router>
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000, padding: '10px', background: 'rgba(0,0,0,0.8)' }}>
          <Button type="primary" style={{ marginRight: '10px' }}>
            <Link to="/" style={{ color: 'white' }}>主页</Link>
          </Button>
          <Button type="primary">
            <Link to="/hefei-map" style={{ color: 'white' }}>合肥地图</Link>
          </Button>
        </div>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/hefei-map" element={<HefeiMapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default AppWithRoutes; 