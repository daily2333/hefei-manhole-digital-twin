export const runtimeConfig = {
  dataSource: (process.env.REACT_APP_DATA_SOURCE || 'mock').toLowerCase(),
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1',
  wsUrl: process.env.REACT_APP_WS_URL || 'http://localhost:3001'
};

export const isApiMode = runtimeConfig.dataSource === 'api';
