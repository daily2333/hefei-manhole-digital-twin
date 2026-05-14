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
import { useAuth } from '../../contexts/AuthContext';

const DashboardTab = lazy(() => import('./DashboardTab'));
const ManholeSceneWrapper = lazy(() => import('../3d-visualization/ManholeSceneWrapper'));

const UserManagement = lazy(() => import('../user-management/UserManagement'));
const AlarmManagement = lazy(() => import('../alarm-management/AlarmManagement'));
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
  const { user } = useAuth();
  const userRole = user?.role || 'viewer';

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

  const tabItems = useMemo(() => {
    const allTabs = [
      {
        key: 'dashboard',
        label: <span><DashboardOutlined /> 综合仪表盘</span>,
        roles: ['admin', 'operator', 'viewer'],
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
        roles: ['admin', 'operator', 'viewer'],
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
        key: 'alarms',
        label: (
          <span>
            <AlertOutlined /> 告警管理
            {unresolvedAlarmCount > 0 && (
              <span className="tab-badge">{unresolvedAlarmCount}</span>
            )}
          </span>
        ),
        roles: ['admin', 'operator'],
        children: wrapLazyTab(<AlarmManagement />)
      },
      {
        key: 'maintenance',
        label: <span><ToolOutlined /> 维护记录</span>,
        roles: ['admin', 'operator'],
        children: wrapLazyTab(<MaintenanceManagement />)
      },
      {
        key: 'devices',
        label: <span><AppstoreOutlined /> 设备管理</span>,
        roles: ['admin', 'operator'],
        children: wrapLazyTab(<DeviceManagement />)
      },
      {
        key: 'analytics',
        label: <span><BarChartOutlined /> 数据分析</span>,
        roles: ['admin', 'operator', 'viewer'],
        children: wrapLazyTab(<DataAnalytics manholes={manholes} alarms={alarms} />)
      },
      {
        key: 'prediction',
        label: <span><PieChartOutlined /> 预测分析</span>,
        roles: ['admin', 'operator'],
        children: wrapLazyTab(<PredictionAnalytics manholes={manholes} alarms={alarms} realTimeDataMap={realTimeDataMap} />)
      },
      {
        key: 'monitoring',
        label: <span><ClockCircleOutlined /> 实时监控</span>,
        roles: ['admin', 'operator'],
        children: wrapLazyTab(<RealTimeMonitoring manholes={manholes} realTimeDataMap={realTimeDataMap} alarms={alarms} />)
      },
      {
        key: 'environment',
        label: <span><CloudOutlined /> 环境数据</span>,
        roles: ['admin', 'operator', 'viewer'],
        children: wrapLazyTab(<EnvironmentData manholes={manholes} realTimeDataMap={realTimeDataMap} />)
      },
      {
        key: 'reports',
        label: <span><AreaChartOutlined /> 统计报表</span>,
        roles: ['admin', 'operator', 'viewer'],
        children: wrapLazyTab(<StatisticalReports manholes={manholes} />)
      },
      {
        key: 'search',
        label: <span><SearchOutlined /> 数据查询</span>,
        roles: ['admin', 'operator', 'viewer'],
        children: wrapLazyTab(<DataSearch manholes={manholes} realTimeDataMap={realTimeDataMap} />)
      },
      {
        key: 'settings',
        label: <span><SettingOutlined /> 系统设置</span>,
        roles: ['admin'],
        children: wrapLazyTab(<SystemSettings />)
      },
      {
        key: 'users',
        label: <span><TeamOutlined /> 用户管理</span>,
        roles: ['admin'],
        children: wrapLazyTab(<UserManagement />)
      }
    ];

    return allTabs.filter(tab => tab.roles.includes(userRole));
  }, [
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
    userRole,
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
