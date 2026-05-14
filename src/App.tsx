import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button, Card, Col, Divider, Row, Statistic, Tag, message } from 'antd';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import MainContent from './components/dashboard/MainContent';
import {
  ManholeInfo,
  ManholeRealTimeData,
  ManholeAlarm,
} from './typings';
import { loadBootstrapData } from './services/bootstrapDataService';
import { fetchAlarms, fetchRealtimeByManhole } from './services/api';
import { formatDateTime } from './utils/dateUtils';
import { getHealthScoreColor, getHealthScoreLevel } from './utils/healthScoreUtils';
import './App.css';

const INITIAL_LOAD_DELAY = 100;
const REALTIME_REFRESH_INTERVAL = 30000;
const ALARM_REFRESH_INTERVAL = 15000;
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
  <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0, 0, 0, 0.7)', color: 'white', margin: '20px', borderRadius: '8px' }}>
    <h2>应用遇到错误</h2>
    <p>请尝试刷新页面或清理浏览器缓存后重新启动应用。</p>
    <Button type="primary" onClick={() => window.location.reload()}>刷新页面</Button>
  </div>
);

const App: React.FC = () => {
  const [manholes, setManholes] = useState<ManholeInfo[]>([]);
  const [selectedManhole, setSelectedManhole] = useState<ManholeInfo | null>(null);
  const [realTimeDataMap, setRealTimeDataMap] = useState<Map<string, ManholeRealTimeData>>(new Map());
  const [alarms, setAlarms] = useState<ManholeAlarm[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [performanceScore, setPerformanceScore] = useState(100);
  const performanceRef = useRef({ lastCheck: Date.now(), frameCount: 0, fps: 60, memoryUsage: 0 });
  const frameRequestRef = useRef<number | null>(null);

  const handleSelectManhole = useCallback((manhole: ManholeInfo) => {
    setSelectedManhole(manhole);
  }, []);

  const fetchManholeData = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await loadBootstrapData();
      setManholes(payload.manholes);
      setRealTimeDataMap(payload.realTimeDataMap);
      setAlarms(payload.alarms);
      setNotifications(payload.alarms.filter((a: ManholeAlarm) => !a.isResolved).length);
    } catch (error) {
      console.error('Failed to load data from API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRealTimeData = useCallback(async () => {
    if (manholes.length === 0) return;
    const batchSize = 5;
    const batchIndex = Math.floor(Date.now() / REALTIME_REFRESH_INTERVAL) % Math.max(1, Math.ceil(manholes.length / batchSize));
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, manholes.length);
    const batch = manholes.slice(start, end);

    const updates = await Promise.allSettled(
      batch.map((m) => fetchRealtimeByManhole(m.id).then((data) => ({ id: m.id, data })))
    );

    setRealTimeDataMap((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const result of updates) {
        if (result.status === 'fulfilled') {
          next.set(result.value.id, result.value.data);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [manholes]);

  const refreshAlarms = useCallback(async () => {
    try {
      const nextAlarms = await fetchAlarms();
      setAlarms(nextAlarms);
      setNotifications(nextAlarms.filter((a) => !a.isResolved).length);
    } catch {
      // silent
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    scheduleIdleTask(async () => {
      await refreshRealTimeData();
      message.success('实时数据已更新');
    }, 2000);
  }, [refreshRealTimeData]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((error) => {
        console.warn('Fullscreen request rejected:', error.message);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(new Date()), CLOCK_INTERVAL);
    return () => window.clearInterval(timerId);
  }, []);

  // Initial data load
  useEffect(() => {
    const timeout = window.setTimeout(fetchManholeData, INITIAL_LOAD_DELAY);
    return () => window.clearTimeout(timeout);
  }, [fetchManholeData]);

  // Periodic real-time data refresh
  useEffect(() => {
    if (manholes.length === 0) return;
    refreshRealTimeData();
    const intervalId = window.setInterval(refreshRealTimeData, REALTIME_REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [manholes.length, refreshRealTimeData]);

  // Periodic alarm refresh
  useEffect(() => {
    if (manholes.length === 0) return;
    refreshAlarms();
    const intervalId = window.setInterval(refreshAlarms, ALARM_REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [manholes.length, refreshAlarms]);

  // Performance monitoring
  useEffect(() => {
    let performanceIntervalId: number | null = null;
    const monitorTimeout = window.setTimeout(() => {
      performanceIntervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - performanceRef.current.lastCheck;
        const fps = elapsed > 0 ? (performanceRef.current.frameCount * 1000) / elapsed : 60;
        let memoryUsage = 0;
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        if (memory && memory.jsHeapSizeLimit > 0) {
          memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }
        performanceRef.current = { lastCheck: now, frameCount: 0, fps, memoryUsage };
        const fpsScore = Math.min(100, (fps * 100) / 60);
        const memoryScore = 100 - (memoryUsage * 100);
        setPerformanceScore(Math.round(fpsScore * 0.7 + memoryScore * 0.3));
      }, PERFORMANCE_MONITOR_INTERVAL);
    }, PERFORMANCE_MONITOR_DELAY);
    return () => {
      window.clearTimeout(monitorTimeout);
      if (performanceIntervalId !== null) window.clearInterval(performanceIntervalId);
    };
  }, []);

  // Frame counter
  useEffect(() => {
    const countFrame = () => {
      performanceRef.current.frameCount += 1;
      frameRequestRef.current = requestAnimationFrame(countFrame);
    };
    frameRequestRef.current = requestAnimationFrame(countFrame);
    return () => {
      if (frameRequestRef.current !== null) cancelAnimationFrame(frameRequestRef.current);
    };
  }, []);

  // Memory GC
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
      if (gcIntervalId !== null) window.clearInterval(gcIntervalId);
    };
  }, []);

  const handleClearNotifications = useCallback(() => setNotifications(0), []);
  const handleTabChange = useCallback((key: string) => setActiveTab(key), []);

  const renderHealthScoreCard = useCallback((manhole: ManholeInfo) => {
    if (!manhole.healthScore) return null;
    return (
      <Card size="small" title="设备健康评分" style={{ marginBottom: '16px' }}
        extra={<Tag color={getHealthScoreColor(manhole.healthScore.total)}>{getHealthScoreLevel(manhole.healthScore.total)}</Tag>}>
        <Statistic title="总评分" value={manhole.healthScore.total} suffix="/ 100"
          valueStyle={{ color: getHealthScoreColor(manhole.healthScore.total), fontSize: '24px' }} />
        <Divider style={{ margin: '12px 0' }} />
        <Row gutter={[16, 16]}>
          <Col span={8}><Statistic title="传感器" value={manhole.healthScore.sensorScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" /></Col>
          <Col span={8}><Statistic title="电池" value={manhole.healthScore.batteryScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" /></Col>
          <Col span={8}><Statistic title="通信" value={manhole.healthScore.communicationScore} valueStyle={{ fontSize: '16px' }} suffix="/ 100" /></Col>
        </Row>
        <div style={{ marginTop: '8px' }}>
          <Tag color={manhole.healthScore.trend === 'rising' ? 'success' : manhole.healthScore.trend === 'falling' ? 'error' : 'default'}>
            {manhole.healthScore.trend === 'rising' ? '上升' : manhole.healthScore.trend === 'falling' ? '下降' : '稳定'}
          </Tag>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
            最后更新 {formatDateTime(new Date(manhole.healthScore.lastUpdated))}
          </span>
        </div>
      </Card>
    );
  }, []);

  return (
    <ErrorBoundary fallback={appFallback}>
      <AppLayout currentTime={currentTime} notifications={notifications} onClearNotifications={handleClearNotifications} isFullscreen={isFullscreen} toggleFullScreen={toggleFullScreen}>
        <MainContent manholes={manholes} alarms={alarms} selectedManhole={selectedManhole} realTimeDataMap={realTimeDataMap} onSelectManhole={handleSelectManhole} activeTab={activeTab} onTabChange={handleTabChange} loading={loading} healthScoreCard={selectedManhole ? renderHealthScoreCard(selectedManhole) : null} onRefresh={handleManualRefresh} performanceScore={performanceScore} />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default React.memo(App);
