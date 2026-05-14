import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import LoginPage from './pages/LoginPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const AppWithRoutes: React.FC = () => {
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
            colorTextHeading: 'rgba(255, 255, 255, 0.95)',
            colorTextDescription: 'rgba(255, 255, 255, 0.85)',
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
            colorText: 'rgba(255, 255, 255, 0.9)',
          },
          Button: {
            controlHeight: 36,
          },
          Form: {
            colorTextLabel: 'rgba(255, 255, 255, 0.85)',
            colorText: 'rgba(255, 255, 255, 0.95)',
          },
          Input: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorBorder: 'rgba(100, 150, 200, 0.2)',
          },
          Select: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
            colorBorder: 'rgba(100, 150, 200, 0.2)',
          },
          DatePicker: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
            colorBorder: 'rgba(100, 150, 200, 0.2)',
          },
          Modal: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgElevated: 'rgba(13, 28, 50, 0.95)',
          },
          Statistic: {
            colorTextDescription: 'rgba(255, 255, 255, 0.85)',
          },
          Tabs: {
            colorText: 'rgba(255, 255, 255, 0.9)',
          },
        },
      }}
    >
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
};

export default AppWithRoutes;
