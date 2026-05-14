import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { Spin, Tabs } from 'antd';
import {
  ManholeInfo,
  ManholeRealTimeData,
  ManholeAlarm,
} from '../../typings';
import {
  DashboardOutlined,
  AlertOutlined,
  ToolOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  PieChartOutlined,
  SettingOutlined,
  TeamOutlined,
  CloudOutlined,
  AreaChartOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { ErrorBoundary } from '../layout/ErrorBoundary';

const DashboardTab = lazy(() => import('./DashboardTab'));
const ManholeSceneWrapper = lazy(() => import('../3d-visualization/ManholeSceneWrapper'));
const ManholeMap = lazy(() => import('../ManholeMap'));
const UserManagement = lazy(() => import('../user-management/UserManagement'));
const AlarmList = lazy(() => import('../alarm-management/AlarmList'));
const MaintenanceManagement = lazy(() => import('../maintenance/MaintenanceManagement'));
const DeviceManagement = lazy(() => import('../device-management/DeviceManagement'));
const EnvironmentData = lazy(() => import('../environment/EnvironmentData'));
const DataAnalytics = lazy(() => import('../data-analytics/DataAnalytics'));
const PredictionAnalytics = lazy(() => import('../prediction/PredictionAnalytics'));
const RealTimeMonitoring = lazy(() => import('../real-time/RealTimeMonitoring'));
const StatisticalReports = lazy(() => import('../statistics/StatisticalReports'));
const DataSearch = lazy(() => import('../data-search/DataSearch'));
const SystemSettings = lazy(() => import('../settings/SystemSettings'));

interface MainContentProps {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  selectedManhole: ManholeInfo | null;
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole: (manhole: ManholeInfo) => void;
  activeTab: string;
  onTabChange: (key: string) => void;
  loading?: boolean;
  healthScoreCard?: React.ReactNode;
  onRefresh?: () => void;
  performanceScore?: number;
}

const tabLoadingFallback = (
  <div
    style={{
      minHeight: 320,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    }}
  >
    <Spin size="large" />
    <span>正在加载模块...</span>
  </div>
);

const MainContent: React.FC<MainContentProps> = ({
  manholes,
  alarms,
  selectedManhole,
  realTimeDataMap,
  onSelectManhole,
  activeTab,
  onTabChange,
  loading = false,
  healthScoreCard,
  onRefresh,
  performanceScore
}) => {
  const handleSelectManholeById = useCallback((manholeId: string) => {
    const manhole = manholes.find((item) => item.id === manholeId);
    if (manhole) {
      onSelectManhole(manhole);
    }
  }, [manholes, onSelectManhole]);

  const unresolvedAlarmCount = useMemo(
    () => alarms.filter((alarm) => !alarm.isResolved).length,
    [alarms]
  );

  const wrapLazyTab = useCallback(
    (content: React.ReactNode) => (
      <Suspense fallback={tabLoadingFallback}>{content}</Suspense>
    ),
    []
  );

  const tabItems = useMemo(() => [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> 综合仪表盘</span>,
      children: wrapLazyTab(
        <DashboardTab
          manholes={manholes}
          alarms={alarms}
          selectedManhole={selectedManhole}
          realTimeDataMap={realTimeDataMap}
          onSelectManhole={onSelectManhole}
          loading={loading}
          healthScoreCard={healthScoreCard}
          onRefresh={onRefresh}
          performanceScore={performanceScore}
        />
      )
    },
    {
      key: 'visualization',
      label: <span><VideoCameraOutlined /> 3D可视化</span>,
      children: wrapLazyTab(
        <ManholeSceneWrapper
          manholes={manholes}
          realTimeDataMap={realTimeDataMap}
          onSelectManhole={handleSelectManholeById}
          selectedManholeId={selectedManhole?.id}
        />
      )
    },
    {
      key: 'map',
      label: <span><EnvironmentOutlined /> 地理分布</span>,
      children: wrapLazyTab(
        <div style={{ height: 'calc(100vh - 170px)', padding: '16px' }}>
          <ErrorBoundary>
            <ManholeMap
              manholes={manholes}
              onSelectManhole={handleSelectManholeById}
              selectedManholeId={selectedManhole?.id}
              style={{ height: '100%' }}
            />
          </ErrorBoundary>
        </div>
      )
    },
    {
      key: 'alarms',
      label: (
        <span>
          <AlertOutlined /> 告警管理
          {unresolvedAlarmCount > 0 && (
            <span className="tab-badge">{unresolvedAlarmCount}</span>
          )}
        </span>
      ),
      children: wrapLazyTab(<AlarmList alarms={alarms} />)
    },
    {
      key: 'maintenance',
      label: <span><ToolOutlined /> 维护记录</span>,
      children: wrapLazyTab(<MaintenanceManagement />)
    },
    {
      key: 'devices',
      label: <span><AppstoreOutlined /> 设备管理</span>,
      children: wrapLazyTab(<DeviceManagement />)
    },
    {
      key: 'analytics',
      label: <span><BarChartOutlined /> 数据分析</span>,
      children: wrapLazyTab(<DataAnalytics manholes={manholes} alarms={alarms} />)
    },
    {
      key: 'prediction',
      label: <span><PieChartOutlined /> 预测分析</span>,
      children: wrapLazyTab(<PredictionAnalytics manholes={manholes} alarms={alarms} />)
    },
    {
      key: 'monitoring',
      label: <span><ClockCircleOutlined /> 实时监控</span>,
      children: wrapLazyTab(<RealTimeMonitoring manholes={manholes} realTimeDataMap={realTimeDataMap} />)
    },
    {
      key: 'environment',
      label: <span><CloudOutlined /> 环境数据</span>,
      children: wrapLazyTab(<EnvironmentData manholes={manholes} realTimeDataMap={realTimeDataMap} />)
    },
    {
      key: 'reports',
      label: <span><AreaChartOutlined /> 统计报表</span>,
      children: wrapLazyTab(<StatisticalReports manholes={manholes} />)
    },
    {
      key: 'search',
      label: <span><SearchOutlined /> 数据查询</span>,
      children: wrapLazyTab(<DataSearch manholes={manholes} realTimeDataMap={realTimeDataMap} />)
    },
    {
      key: 'settings',
      label: <span><SettingOutlined /> 系统设置</span>,
      children: wrapLazyTab(<SystemSettings />)
    },
    {
      key: 'users',
      label: <span><TeamOutlined /> 用户管理</span>,
      children: wrapLazyTab(<UserManagement />)
    }
  ], [
    alarms,
    handleSelectManholeById,
    healthScoreCard,
    loading,
    manholes,
    onRefresh,
    onSelectManhole,
    performanceScore,
    realTimeDataMap,
    selectedManhole,
    unresolvedAlarmCount,
    wrapLazyTab
  ]);

  return (
    <ErrorBoundary>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        className="main-tabs"
        tabPosition="left"
        tabBarGutter={8}
        destroyInactiveTabPane
        items={tabItems}
      />
    </ErrorBoundary>
  );
};

export default MainContent;
