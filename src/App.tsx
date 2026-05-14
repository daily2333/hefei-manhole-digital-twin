import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button, Card, Col, ConfigProvider, Divider, Row, Statistic, Tag, theme, message } from 'antd';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import MainContent from './components/dashboard/MainContent';
import {
  ManholeInfo,
  ManholeRealTimeData,
  ManholeAlarm,
} from './typings';
import {
  generateMockRealTimeData,
  getRandomInt
} from './mock-data/manholes';
import { formatDateTime } from './utils/dateUtils';
import { getHealthScoreColor, getHealthScoreLevel } from './utils/healthScoreUtils';
import { loadBootstrapData } from './services/bootstrapDataService';
import './App.css';

const INITIAL_LOAD_DELAY = 100;
const FIRST_REALTIME_REFRESH_DELAY = 30000;
const REALTIME_REFRESH_INTERVAL = 7200000;
const PERFORMANCE_MONITOR_DELAY = 30000;
const PERFORMANCE_MONITOR_INTERVAL = 10000;
const GC_START_DELAY = 300000;
const GC_INTERVAL = 600000;
const CLOCK_INTERVAL = 1000;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  gc?: () => void;
};

const scheduleIdleTask = (callback: () => void, timeout = 1000) => {
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(callback, { timeout });
    return;
  }

  setTimeout(callback, 0);
};

const appFallback = (
  <div
    style={{
      padding: '20px',
      textAlign: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      margin: '20px',
      borderRadius: '8px'
    }}
  >
    <h2>应用遇到错误</h2>
    <p>请尝试刷新页面或清理浏览器缓存后重新启动应用。</p>
    <Button type="primary" onClick={() => window.location.reload()}>
      刷新页面
    </Button>
  </div>
);

const App: React.FC = () => {
  const { darkAlgorithm } = theme;
  const [manholes, setManholes] = useState<ManholeInfo[]>([]);
  const [selectedManhole, setSelectedManhole] = useState<ManholeInfo | null>(null);
  const [realTimeDataMap, setRealTimeDataMap] = useState<Map<string, ManholeRealTimeData>>(new Map());
  const [alarms, setAlarms] = useState<ManholeAlarm[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [performanceScore, setPerformanceScore] = useState(100);
  const performanceRef = useRef({
    lastCheck: Date.now(),
    frameCount: 0,
    fps: 60,
    memoryUsage: 0
  });
  const frameRequestRef = useRef<number | null>(null);

  const handleSelectManhole = useCallback((manhole: ManholeInfo) => {
    setSelectedManhole(manhole);
  }, []);

  const fetchManholeData = useCallback(async () => {
    try {
      setLoading(true);

      const bootstrapPayload = await loadBootstrapData();
      setManholes(bootstrapPayload.manholes);
      setRealTimeDataMap(bootstrapPayload.realTimeDataMap);
      setAlarms(bootstrapPayload.alarms);
      setNotifications(bootstrapPayload.source === 'api' ? 0 : getRandomInt(1, 10));
    } catch (error) {
      console.error('Failed to load mock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRealTimeData = useCallback(() => {
    if (manholes.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      setRealTimeDataMap((previousMap) => {
        const nextMap = new Map(previousMap);
        const batchSize = 10;
        const totalManholes = manholes.length;
        const batchCount = Math.max(1, Math.ceil(totalManholes / batchSize));
        const batchIndex = Math.floor(Date.now() / 3600000) % batchCount;
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalManholes);

        for (let index = startIndex; index < endIndex; index += 1) {
          const manhole = manholes[index];
          if (!manhole) {
            continue;
          }

          const nextData = generateMockRealTimeData(manhole.id, manhole.status);
          const previousData = nextMap.get(manhole.id);

          if (!previousData) {
            nextMap.set(manhole.id, nextData);
            continue;
          }

          const temperatureBase = Math.max(Math.abs(previousData.temperature), 0.1);
          const humidityBase = Math.max(Math.abs(previousData.humidity), 0.1);
          const batteryBase = Math.max(Math.abs(previousData.batteryLevel), 0.1);
          const temperatureChanged = Math.abs(previousData.temperature - nextData.temperature) / temperatureBase > 0.05;
          const humidityChanged = Math.abs(previousData.humidity - nextData.humidity) / humidityBase > 0.05;
          const batteryChanged = Math.abs(previousData.batteryLevel - nextData.batteryLevel) / batteryBase > 0.05;

          if (temperatureChanged || humidityChanged || batteryChanged || previousData.coverStatus !== nextData.coverStatus) {
            nextMap.set(manhole.id, nextData);
          }
        }

        return nextMap;
      });
    });
  }, [manholes]);

  const handleManualRefresh = useCallback(() => {
    scheduleIdleTask(() => {
      updateRealTimeData();
      message.success('实时数据已更新');
    }, 2000);
  }, [updateRealTimeData]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((error) => {
        console.warn(`Fullscreen request rejected: ${error.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    setIsFullscreen((previous) => !previous);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, CLOCK_INTERVAL);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const initialLoadTimeout = window.setTimeout(() => {
      fetchManholeData();
    }, INITIAL_LOAD_DELAY);

    return () => {
      window.clearTimeout(initialLoadTimeout);
    };
  }, [fetchManholeData]);

  useEffect(() => {
    if (manholes.length === 0) {
      return;
    }

    let intervalId: number | null = null;

    const initialUpdateTimeout = window.setTimeout(() => {
      updateRealTimeData();

      intervalId = window.setInterval(() => {
        requestAnimationFrame(() => {
          updateRealTimeData();
        });
      }, REALTIME_REFRESH_INTERVAL);
    }, FIRST_REALTIME_REFRESH_DELAY);

    return () => {
      window.clearTimeout(initialUpdateTimeout);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [manholes.length, updateRealTimeData]);

  useEffect(() => {
    let performanceIntervalId: number | null = null;

    const monitorTimeout = window.setTimeout(() => {
      performanceIntervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - performanceRef.current.lastCheck;
        const fps = elapsed > 0 ? (performanceRef.current.frameCount * 1000) / elapsed : 60;

        let memoryUsage = 0;
        const memory = (performance as Performance & {
          memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
        }).memory;

        if (memory && memory.jsHeapSizeLimit > 0) {
          memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }

        performanceRef.current = {
          lastCheck: now,
          frameCount: 0,
          fps,
          memoryUsage
        };

        const fpsScore = Math.min(100, (fps * 100) / 60);
        const memoryScore = 100 - (memoryUsage * 100);
        setPerformanceScore(Math.round(fpsScore * 0.7 + memoryScore * 0.3));
      }, PERFORMANCE_MONITOR_INTERVAL);
    }, PERFORMANCE_MONITOR_DELAY);

    return () => {
      window.clearTimeout(monitorTimeout);
      if (performanceIntervalId !== null) {
        window.clearInterval(performanceIntervalId);
      }
    };
  }, []);

  useEffect(() => {
    const countFrame = () => {
      performanceRef.current.frameCount += 1;
      frameRequestRef.current = requestAnimationFrame(countFrame);
    };

    frameRequestRef.current = requestAnimationFrame(countFrame);

    return () => {
      if (frameRequestRef.current !== null) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let gcIntervalId: number | null = null;

    const gcTimeout = window.setTimeout(() => {
      gcIntervalId = window.setInterval(() => {
        scheduleIdleTask(() => {
          try {
            THREE.Cache.clear();
            (window as IdleWindow).gc?.();
          } catch (error) {
            console.warn('Resource cleanup failed:', error);
          }
        });
      }, GC_INTERVAL);
    }, GC_START_DELAY);

    return () => {
      window.clearTimeout(gcTimeout);
      if (gcIntervalId !== null) {
        window.clearInterval(gcIntervalId);
      }
    };
  }, []);

  const handleClearNotifications = useCallback(() => {
    setNotifications(0);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  const renderHealthScoreCard = useCallback((manhole: ManholeInfo) => {
    if (!manhole.healthScore) {
      return null;
    }

    return (
      <Card
        size="small"
        title="设备健康评分"
        style={{ marginBottom: '16px' }}
        extra={
          <Tag color={getHealthScoreColor(manhole.healthScore.total)}>
            {getHealthScoreLevel(manhole.healthScore.total)}
          </Tag>
        }
      >
        <Statistic
          title="总评分"
          value={manhole.healthScore.total}
          suffix="/ 100"
          valueStyle={{
            color: getHealthScoreColor(manhole.healthScore.total),
            fontSize: '24px'
          }}
        />
        <Divider style={{ margin: '12px 0' }} />
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic title="传感器" value={manhole.healthScore.sensorScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" />
          </Col>
          <Col span={8}>
            <Statistic title="电池" value={manhole.healthScore.batteryScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" />
          </Col>
          <Col span={8}>
            <Statistic title="通信" value={manhole.healthScore.communicationScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" />
          </Col>
        </Row>
        <div style={{ marginTop: '8px' }}>
          <Tag
            color={
              manhole.healthScore.trend === 'rising'
                ? 'success'
                : manhole.healthScore.trend === 'falling'
                  ? 'error'
                  : 'default'
            }
          >
            {manhole.healthScore.trend === 'rising'
              ? '上升'
              : manhole.healthScore.trend === 'falling'
                ? '下降'
                : '稳定'}
          </Tag>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
            最后更新 {formatDateTime(new Date(manhole.healthScore.lastUpdated))}
          </span>
        </div>
      </Card>
    );
  }, []);

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
          },
          Button: {
            controlHeight: 36,
          },
          Form: {
            colorTextLabel: 'rgba(255, 255, 255, 0.85)',
            colorText: 'rgba(255, 255, 255, 0.95)'
          },
          Input: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorBorder: 'rgba(100, 150, 200, 0.2)'
          },
          Select: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
            colorBorder: 'rgba(100, 150, 200, 0.2)'
          },
          DatePicker: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgContainer: 'rgba(0, 20, 40, 0.5)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
            colorBorder: 'rgba(100, 150, 200, 0.2)'
          },
          Modal: {
            colorText: 'rgba(255, 255, 255, 0.95)',
            colorBgElevated: 'rgba(13, 28, 50, 0.95)'
          },
        },
      }}
    >
      <ErrorBoundary fallback={appFallback}>
        <AppLayout
          currentTime={currentTime}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          isFullscreen={isFullscreen}
          toggleFullScreen={toggleFullScreen}
        >
          <MainContent
            manholes={manholes}
            alarms={alarms}
            selectedManhole={selectedManhole}
            realTimeDataMap={realTimeDataMap}
            onSelectManhole={handleSelectManhole}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            loading={loading}
            healthScoreCard={selectedManhole ? renderHealthScoreCard(selectedManhole) : null}
            onRefresh={handleManualRefresh}
            performanceScore={performanceScore}
          />
        </AppLayout>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default React.memo(App);
