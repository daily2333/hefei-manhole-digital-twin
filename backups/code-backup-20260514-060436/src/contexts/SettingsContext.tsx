import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 系统设置接口
export interface SystemSettings {
  // 常规设置
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  notificationsEnabled: boolean;
  dataRefreshInterval: number;

  // 外观设置
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  compactMode: boolean;
  animationsEnabled: boolean;

  // 3D可视化设置
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
  renderDistance: number;

  // 系统维护设置
  autoBackup: boolean;
  backupInterval: number;
  logLevel: string;
  dataRetentionDays: number;
}

// 设置默认值
const defaultSettings: SystemSettings = {
  // 常规设置
  language: 'zh_CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24hour',
  notificationsEnabled: true,
  dataRefreshInterval: 30,

  // 外观设置
  theme: 'dark',
  primaryColor: 'blue',
  compactMode: false,
  animationsEnabled: true,

  // 3D可视化设置
  graphicsQuality: 'medium',
  showFps: false,
  renderDistance: 50,

  // 系统维护设置
  autoBackup: true,
  backupInterval: 24,
  logLevel: 'info',
  dataRetentionDays: 90
};

// 创建上下文
interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
  getEffectiveTheme: () => 'dark'
});

// 上下文 Provider
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // 从本地存储加载设置或使用默认值
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('system-settings');
      return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch (error) {
      console.error('读取设置失败:', error);
      return defaultSettings;
    }
  });

  // 更新设置
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      // 保存到本地存储
      try {
        localStorage.setItem('system-settings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
      return updatedSettings;
    });
  };

  // 重置设置
  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem('system-settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('重置设置失败:', error);
    }
  };

  // 获取有效的主题设置
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.theme === 'system') {
      // 检查操作系统偏好
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return settings.theme;
  };

  // 监听系统主题变化
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // 触发更新
        setSettings(prevSettings => ({ ...prevSettings }));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return () => {};
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, getEffectiveTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 自定义Hook
export const useSettings = () => useContext(SettingsContext); 