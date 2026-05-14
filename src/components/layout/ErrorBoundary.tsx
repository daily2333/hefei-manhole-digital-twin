import React from 'react';
import { Alert } from 'antd';

/**
 * 错误边界组件，捕获子组件中的错误并显示备用UI
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("渲染错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', textAlign: 'center' }}>
          <Alert message="渲染错误" description="组件加载失败，我们正在修复中" type="error" showIcon />
        </div>
      );
    }
    return this.props.children;
  }
} 