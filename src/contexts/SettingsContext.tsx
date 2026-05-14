import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export interface SystemSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  notificationsEnabled: boolean;
  dataRefreshInterval: number;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
  renderDistance: number;
  autoBackup: boolean;
  backupInterval: number;
  logLevel: string;
  dataRetentionDays: number;
}

const defaultSettings: SystemSettings = {
  language: 'zh_CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24hour',
  notificationsEnabled: true,
  dataRefreshInterval: 30,
  theme: 'dark',
  primaryColor: 'blue',
  compactMode: false,
  animationsEnabled: true,
  graphicsQuality: 'medium',
  showFps: false,
  renderDistance: 50,
  autoBackup: true,
  backupInterval: 24,
  logLevel: 'info',
  dataRetentionDays: 90
};

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

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('system-settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch (error) {
      console.error('读取设置失败:', error);
      localStorage.removeItem('system-settings');
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem('system-settings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
      return updatedSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem('system-settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('重置设置失败:', error);
    }
  }, []);

  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (settings.theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setSettings(prev => {
          if (prev.theme === 'system') {
            return { ...prev }; // trigger re-render only when system theme is active
          }
          return prev;
        });
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return () => {};
  }, [settings.theme]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    getEffectiveTheme
  }), [settings, updateSettings, resetSettings, getEffectiveTheme]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
