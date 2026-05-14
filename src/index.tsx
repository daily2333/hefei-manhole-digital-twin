import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from 'antd';
import './index.css';
import AppWithRoutes from './AppWithRoutes';
import reportWebVitals from './reportWebVitals';
import { SettingsProvider } from './contexts/SettingsContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  return true;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App>
          <AppWithRoutes />
        </App>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
