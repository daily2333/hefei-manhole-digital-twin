import { SystemSettings } from '../contexts/SettingsContext';
import * as THREE from 'three';

/**
 * 根据图形质量设置返回Three.js的渲染器配置
 */
export const getRendererSettings = (quality: SystemSettings['graphicsQuality']) => {
  switch (quality) {
    case 'low':
      return {
        shadowMapEnabled: false,
        shadowMapSize: 512,
        antialias: false,
        pixelRatio: Math.min(1.5, window.devicePixelRatio),
        outputColorSpace: THREE.LinearSRGBColorSpace
      };
    case 'medium':
      return {
        shadowMapEnabled: true,
        shadowMapSize: 1024,
        antialias: true,
        pixelRatio: Math.min(2, window.devicePixelRatio),
        outputColorSpace: THREE.SRGBColorSpace
      };
    case 'high':
      return {
        shadowMapEnabled: true,
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: window.devicePixelRatio,
        outputColorSpace: THREE.SRGBColorSpace
      };
    default:
      return {
        shadowMapEnabled: true,
        shadowMapSize: 1024,
        antialias: true,
        pixelRatio: Math.min(2, window.devicePixelRatio),
        outputColorSpace: THREE.SRGBColorSpace
      };
  }
};

/**
 * 应用主题色到UI
 */
export const applyThemeColor = (color: string) => {
  // 定义不同色系的主色调
  const colorMap: Record<string, string> = {
    blue: '#1890ff',
    green: '#52c41a',
    purple: '#722ed1',
    red: '#f5222d',
    orange: '#fa8c16'
  };

  // 获取实际颜色值
  const themeColor = colorMap[color] || colorMap.blue;
  
  // 创建一个CSS变量来控制主题色
  document.documentElement.style.setProperty('--primary-color', themeColor);
  
  return themeColor;
};

/**
 * 应用主题模式（亮色/暗色）
 */
export const applyTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.documentElement.classList.remove('light-theme');
  } else {
    document.documentElement.classList.add('light-theme');
    document.documentElement.classList.remove('dark-theme');
  }
};

/**
 * 应用紧凑模式
 */
export const applyCompactMode = (isCompact: boolean) => {
  if (isCompact) {
    document.documentElement.classList.add('compact-mode');
  } else {
    document.documentElement.classList.remove('compact-mode');
  }
};

/**
 * 应用动画效果设置
 */
export const applyAnimations = (enableAnimations: boolean) => {
  if (!enableAnimations) {
    document.documentElement.classList.add('disable-animations');
  } else {
    document.documentElement.classList.remove('disable-animations');
  }
};

/**
 * 应用日期格式
 */
export const formatDateWithSettings = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * 应用时间格式
 */
export const formatTimeWithSettings = (date: Date, format: string): string => {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  if (format === '12hour') {
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // 将0转换为12
    return `${hours}:${minutes}:${seconds} ${period}`;
  } else {
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  }
};

/**
 * 应用所有系统设置
 */
export const applySystemSettings = (settings: SystemSettings) => {
  // 应用主题
  const theme = settings.theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme;
  
  applyTheme(theme);
  applyThemeColor(settings.primaryColor);
  applyCompactMode(settings.compactMode);
  applyAnimations(settings.animationsEnabled);
  
  // 你可以返回应用的设置供其他组件使用
  return {
    theme,
    rendererSettings: getRendererSettings(settings.graphicsQuality),
    showFps: settings.showFps,
    renderDistance: settings.renderDistance,
  };
}; 