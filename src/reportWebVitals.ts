import { ReportHandler } from 'web-vitals';

// 简化的性能指标上报函数
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // 只有在提供有效回调函数时才启用性能监控
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
