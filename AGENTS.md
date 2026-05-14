# 项目知识库（manhole-digital-twin）

## 工作约束

- 禁止批量删除文件或目录。
- 不要使用以下命令：
  - `del /s`
  - `rd /s`
  - `rmdir /s`
  - `Remove-Item -Recurse`
  - `rm -rf`
- 如果需要删除文件，只能一次删除一个明确路径的文件。
- 正确示例：`Remove-Item "C:\path\to\file.txt"`
- 如果需要批量删除文件，应停止操作，并让用户手动删除。

## 项目定位

这是一个“智能井盖数字孪生”前端项目，核心目标是用大屏/控制台风格界面展示井盖资产、实时监测、告警、维护、地图分布、3D 可视化、预测分析、环境数据、统计报表、数据检索和系统设置。

当前实现明显偏向“前端演示平台 + 模拟数据驱动”，不是直接连接真实后端的生产系统：

- 绝大多数业务数据来自 `src/mock-data`。
- 实时数据通过 Hook + 定时器模拟更新。
- 预测分析基于前端内的简单线性回归和 Z-Score 异常检测。
- 地图和 3D 场景做了较多展示与性能优化，但数据源仍以模拟为主。

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- React Router
- ECharts / `echarts-for-react`
- Ant Design Charts
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- 高德地图 JS API
- Day.js

## 入口与应用骨架

### 入口文件

- `src/index.tsx`
  - 创建 React 根节点。
  - 包裹本地 `ErrorBoundary`。
  - 注入 `SettingsProvider`。
  - 渲染 `AppWithRoutes`。
  - 注册全局 `window.onerror` 和 `window.onunhandledrejection`。

- `src/AppWithRoutes.tsx`
  - 使用 `BrowserRouter`。
  - 当前只提供两个路由：
    - `/` -> `App`
    - `/hefei-map` -> `HefeiMapPage`
  - 页面左上角有一个简单的固定路由切换按钮条。

### 主应用

- `src/App.tsx`
  - 是主控制台页面的核心容器。
  - 负责初始化以下主状态：
    - `manholes`
    - `selectedManhole`
    - `realTimeDataMap`
    - `alarms`
    - `maintenanceRecords`
    - `activeTab`
    - `notifications`
    - `loading`
    - `performanceScore`
  - 首次加载时调用 `generateEnhancedManholes(30)` 生成井盖基础数据。
  - 然后生成：
    - 实时数据 `Map`
    - 告警列表
    - 维护记录
  - 通过 `MainContent` 把主数据分发给各业务模块。
  - 主题是深色大屏风格，Ant Design Token 在此和 `AppLayout` 里都有重复配置。

### 布局层

- `src/components/layout/AppLayout.tsx`
  - 定义整站布局：头部、主体、页脚、赛博背景。
  - 页脚文案指向“智慧井盖中央管理平台 / 城市基础设施管理中心”。

- `src/components/layout/AppHeader.tsx`
  - 展示平台标题、系统状态、通知、帮助、用户按钮。

- `src/components/layout/SystemStatusPanel.tsx`
  - 用于展示当前时间等系统信息。

- `src/components/layout/ErrorBoundary.tsx`
  - 通用错误边界。

## 主导航与功能模块

`src/components/dashboard/MainContent.tsx` 是主工作台的标签页分发器，采用 `lazy + Suspense` 按需加载，左侧标签页目前包括：

- 综合仪表盘 `dashboard`
- 3D 可视化 `visualization`
- 地理分布 `map`
- 告警管理 `alarms`
- 维护记录 `maintenance`
- 设备管理 `devices`
- 数据分析 `analytics`
- 预测分析 `prediction`
- 实时监控 `monitoring`
- 环境数据 `environment`
- 统计报表 `reports`
- 数据查询 `search`
- 系统设置 `settings`
- 用户管理 `users`

## 目录结构理解

### `src/components`

按业务域拆分，主要包括：

- `3d-visualization`
  - 井盖 3D 场景、合肥场景、地理融合场景、井盖盖板模型、包装组件。
- `alarm-management`
  - 告警总览、告警列表、确认/处理等。
- `amap`
  - 高德地图基础封装，包含地图、点位、信息窗、聚合、类型定义。
- `dashboard`
  - 仪表盘相关卡片、图表、详情、主标签页。
- `data-analytics`
  - 偏综合统计分析。
- `data-search`
  - 检索/筛选/查询界面。
- `device-management`
  - 设备列表、设备管理。
- `environment`
  - 环境数据分析与展示。
- `layout`
  - 通用布局组件。
- `maintenance`
  - 维护管理。
- `prediction`
  - 预测分析。
- `real-time`
  - 实时监控大模块。
- `reports`
  - 日报组件。
- `settings`
  - 系统设置面板。
- `statistics`
  - 统计报表容器与报表页。
- `user-management`
  - 用户管理。

### `src/mock-data`

- `manholes.ts`
  - 主模拟数据源。
  - 负责生成井盖、实时数据、告警、维护、健康评分历史。
- `hefeiManholes.ts`
  - 合肥地图专用模拟数据，默认生成 150 个点。

### `src/hooks`

- `useRealTimeData.ts`
  - 单井盖实时数据 Hook。
  - 多井盖实时数据 Hook。
  - 有全局缓存、延迟批处理、显著变化阈值判断、空闲时更新等性能优化。

### `src/services`

- `predictionService.ts`
  - 简易预测与异常分析服务。

### `src/utils`

- 日期、告警、健康评分、系统设置、高德地图加载与辅助函数等。

### `src/pages`

- `HefeiMapPage.tsx`
  - 合肥井盖分布专题页面。
- `DailyReportPage.tsx`
  - 统计报表页面包装。

## 核心数据模型

定义在 `src/typings/index.ts`。

### 井盖主实体 `ManholeInfo`

包含：

- 基础身份：`id`、`name`、`deviceId`
- 运行状态：`status`
- 位置：`location`
- 设备信息：`model`、`manufacturer`、`material`
- 安装维护：`installationDate`、`lastMaintenanceTime`、`nextMaintenanceTime`
- 尺寸：`diameter`、`depth`
- 责任人：`manager`、`contactPhone`
- 传感器：`sensorTypes`
- 扩展信息：`latestAlarm`、`latestMaintenance`、`latestData`、`healthScore`

### 实时数据 `ManholeRealTimeData`

字段包括：

- `waterLevel`
- `gasConcentration`：`ch4`、`co`、`h2s`、`o2`
- `temperature`
- `humidity`
- `batteryLevel`
- `signalStrength`
- `coverStatus`
- `accelerometer`
- `tilt`
- `accuracy`

### 告警模型 `ManholeAlarm`

字段包括：

- 告警类型 `type`
- 告警级别 `level`
- 时间 `time`
- 是否解决 `isResolved`
- 推送/确认/解决相关时间
- `anomalyScore`
- `normalRange`
- `actualValue`

### 维护记录 `MaintenanceRecord`

字段包括：

- 维护类型
- 描述
- 操作人
- 联系电话
- 维护状态：`pending / inProgress / completed / cancelled`
- 图片列表

### 健康评分 `HealthScore`

由三部分组成：

- `sensorScore`
- `batteryScore`
- `communicationScore`

总分公式：

- `0.4 * 传感器 + 0.3 * 电池 + 0.3 * 通信`

## 模拟数据机制

### 井盖主数据

`src/mock-data/manholes.ts`

- `generateMockManholes(count)`
  - 随机生成井盖基础资产。
  - 状态分布大致为：
    - 正常 60%
    - 预警 15%
    - 报警 10%
    - 维护 5%
    - 离线 10%

### 实时数据

- `generateMockRealTimeData(manholeId, statusOverride?)`
  - 按“井盖 ID + 当前小时”生成稳定数据。
  - 使用 `lastGeneratedData` 保留上一轮结果，避免波动太大。
  - 变化考虑了：
    - 季节
    - 日内温度周期
    - 状态覆盖（正常/预警/报警/维护/离线）
  - 不同状态会改变温度、湿度、气体、水位、电量、信号和井盖开合状态。

### 告警

- `generateMockAlarms(manholes)`
  - 为符合条件的井盖按概率生成告警。
  - 用历史样本 + `detectAnomaly` 做 Z-Score 异常判断。
  - 再通过 `determineAlarmLevel` 决定级别。

### 维护记录

- `generateMockMaintenanceRecords(manholes)`
  - 每个井盖随机生成 0 到 2 条维护记录。

### 增强井盖

- `generateEnhancedManholes(count)`
  - 在基础井盖上补齐：
    - `latestData`
    - `healthScore`

### 合肥专题数据

`src/mock-data/hefeiManholes.ts`

- 以合肥市中心坐标为基础随机生成点位。
- 70% 点位围绕地标分布，30% 全市范围随机分布。
- 地址、行政区、街道名都做了合肥本地化模拟。
- 默认导出 `hefeiManholes = generateHefeiManholes(150)`。

## 实时数据与性能策略

### `App.tsx` 层

- 初次加载时延迟 100ms 拉起数据。
- 30 秒后做第一次补充更新。
- 之后按 2 小时间隔更新实时数据。
- 更新时按批次处理井盖，避免一次性刷新全部数据。
- 只在关键指标变化显著时更新 `realTimeDataMap`。

### `useRealTimeData.ts`

已实现较多前端性能优化：

- 全局缓存 `globalDataCache`
- 过期缓存清理
- 单井盖和多井盖两类 Hook
- `requestIdleCallback`
- `requestAnimationFrame`
- 显著变化阈值控制
- 分批装载与分批更新
- 避免组件卸载后更新

注意：

- 文件顶层直接 `setInterval(cleanupCache, ...)`，属于全局副作用。
- 默认实时刷新间隔是 1 小时，不是秒级真实时。

## 仪表盘与业务模块理解

### 综合仪表盘 `src/components/dashboard/DashboardTab.tsx`

主要用于展示总览：

- 系统运行状态仪表盘
- 温度趋势图
- 设备状态分布饼图
- 告警趋势图
- 异常设备列表
- 底部统计卡片
- 状态汇总卡片

目前很多图表数据是前端临时生成或由已有模拟数据统计得出。

### 井盖详情类组件

- `ManholeDetail.tsx`
  - 展示单井盖的实时字段。
- `ManholeDataPanel.tsx`
  - 以卡片和图表方式展示温度、湿度、气体、电池、信号等。
- `PredictionChart.tsx`
  - 展示单设备预测曲线，可叠加阈值。
- `DeviceHealthPanel.tsx`
  - 基于 `predictionService` 展示健康评分、寿命预估、异常分析和建议。

### 告警管理

- `AlarmList.tsx`
  - 主标签页实际使用的告警列表组件。
- `AlarmManagement.tsx`
  - 更完整的告警管理页，包含图表和多维操作。

### 设备管理

- `DeviceManagement.tsx`
  - 大型综合管理页。
- `DeviceList.tsx`
  - 列表化设备信息。

### 维护管理

- `MaintenanceManagement.tsx`
  - 维护记录查询、状态管理等。

### 数据分析 / 环境 / 实时 / 搜索 / 统计 / 用户

这些模块都已经是较完整的单页级组件，文件都比较大，说明当前项目不是简单 Demo，而是试图覆盖一个完整运维中台的前端面。

重点理解：

- `DataAnalytics.tsx`：偏综合分析。
- `EnvironmentData.tsx`：环境趋势与分布。
- `RealTimeMonitoring.tsx`：实时监控总览。
- `DataSearch.tsx`：查询筛选入口。
- `StatisticalReports.tsx`：统计报表主页面。
- `UserManagement.tsx`：用户、角色、状态等管理界面。

## 地图系统

### 高德配置

`src/config/mapConfig.ts`

- 已硬编码高德相关密钥：
  - `apiKey`
  - `securityKey`
  - `securityJsCode`
- 默认地图中心是合肥：
  - `[117.27, 31.86]`
- 默认缩放级别 `12`

### 地图工具

`src/utils` 下地图相关文件负责：

- `mapLoader.ts`
  - 动态加载高德脚本并做 API 修补。
- `mapHelpers.ts`
  - 安全创建 `LngLat`、计算距离、像素对象等。
- `mapMarkers.ts`
  - 标记点图标、Marker 构造与添加。
- `mapGeocoding.ts`
  - 地理编码、逆地理编码、批量地理编码。

### 地图组件

- `src/components/amap/AMap.tsx`
  - 地图底层封装，包含 marker / infowindow 子组件实现。
- `AMapMarker.tsx`
- `AMapInfoWindow.tsx`
- `AMapCluster.tsx`
- `types.ts`

### 主地图页面

- `src/components/ManholeMap.tsx`
  - 主应用中的地理分布模块。
- `src/components/HeifeiManholeMap.tsx`
  - 合肥专题地图。
- `src/pages/HefeiMapPage.tsx`
  - 合肥井盖专题页面，左侧地图，右侧详情卡，顶部状态统计。

## 3D 可视化

主要文件：

- `ManholeScene.tsx`
- `ManholeSceneWrapper.tsx`
- `ManholeCover3D.tsx`
- `GeoManholeScene.tsx`
- `HefeiManholeScene.tsx`

理解要点：

- 使用 `react-three-fiber + drei + three`。
- 井盖的开合状态会映射到 3D 表现。
- 地理融合场景 `GeoManholeScene.tsx` 会把经纬度映射到 Three 场景坐标。
- 有专门的 `Scene3DConfig` 类型说明这是一个被认真考虑过性能参数的子系统。
- 项目中显式存在 Three 缓存清理、帧率统计、显存/内存关注等逻辑。

## 预测与异常分析

`src/services/predictionService.ts`

当前预测服务是纯前端简化实现，不依赖真实机器学习服务：

- `predictFutureTrend`
  - 基于历史模拟数据做线性回归，预测未来 24 小时趋势。
- `detectDataAnomalies`
  - 用 Z-Score 找异常点，并给出 `low / medium / high` 风险等级。
- `predictDeviceHealth`
  - 结合安装时间、状态、电池趋势估算健康分和剩余寿命。
- `getLifecyclePrediction`
  - 估算使用月数、剩余月份、下次维护时间和风险级别。

这说明“预测分析”模块目前本质上是规则模型，不是真实 AI/时序预测服务。

## 系统设置

### Context

`src/contexts/SettingsContext.tsx`

提供：

- `settings`
- `updateSettings`
- `resetSettings`
- `getEffectiveTheme`

设置会落到 `localStorage` 的 `system-settings`。

### 设置项

包含：

- 语言、时区、日期格式、时间格式
- 通知开关、数据刷新间隔
- 主题、主色、紧凑模式、动画开关
- 图形质量、FPS 显示、渲染距离
- 自动备份、备份周期、日志级别、数据保留天数

### 工具函数

`src/utils/settingsUtils.ts` 负责：

- 根据图形质量生成 Three 渲染参数
- 应用主题色
- 切换深浅主题
- 切换紧凑模式
- 控制动画开关
- 基于设置格式化日期/时间

## 报表页面

- `src/pages/DailyReportPage.tsx`
  - 自己构造了一份 20 条井盖的 mock 数据。
  - 渲染 `ReportContainer`。
- `src/components/reports/DailyReport.tsx`
  - 日报展示组件。
- `src/components/statistics/ReportContainer.tsx`
  - 报表容器。
- `src/components/statistics/StatisticalReports.tsx`
  - 报表主界面。

可以看出“日报”和“统计报表”存在一定并行/重复能力。

## 样式系统

- `src/App.css`
  - 主体视觉样式，体量很大。
- `src/index.css`
  - 全局基础样式。
- `src/styles/global.css`
  - 另一份全局样式资源。
- `src/temp_theme.txt`
  - 看起来是主题 token 的临时文本，不是标准源码模块。

整体视觉风格：

- 深色
- 大屏
- 科技感背景
- 强调卡片、图表、状态色

## 我观察到的实现特征与注意事项

### 1. 存在一些重复/备份文件

- `src/index_new.tsx`
- `src/AppWithRoutes.tsx.bak`
- `src/typings/index.ts.bak`

这些文件说明项目在迭代中保留了备份版本，后续改动时要先确认哪些才是实际入口。

### 2. 有较明显的中文编码问题痕迹

从源文件内容看，注释和部分文案存在乱码/混杂现象，但字符串语义仍可从上下文判断。

后续修改时要注意：

- 先确认文件真实编码。
- 避免无意扩大乱码范围。

### 3. 数据来源目前以前端模拟为主

虽然依赖里有：

- `axios`
- `mqtt`
- `socket.io-client`

但当前已读主流程里没有看到真实后端接入成为主路径，系统核心仍由 mock 驱动。

### 4. 高德密钥直接硬编码在源码

这在真实生产环境是风险点。后续若做部署或开源整理，应转环境变量或服务端代理。

### 5. 性能优化是项目的显式目标之一

代码里反复出现：

- `memo`
- `useMemo`
- `useCallback`
- `lazy`
- `Suspense`
- `requestIdleCallback`
- `requestAnimationFrame`
- 分批更新
- 缓存清理

说明作者明确关注大屏、多图表、3D、地图场景下的渲染成本。

### 6. 部分主题配置有重复

`App.tsx`、`AppWithRoutes.tsx`、`AppLayout.tsx` 都在写 Ant Design `ConfigProvider` 主题，后续统一主题时要注意不要只改一处。

### 7. 页面能力比入口暴露得更多

路由目前只有：

- 主应用
- 合肥专题地图

但源码里实际已经有大量可独立存在的业务页面级组件。后续扩展路由成本不高。

## 后续代理接手时的高价值认知

- 先确认修改目标属于“主应用控制台”还是“合肥专题地图”。
- 涉及数据口径时，优先检查 `src/typings/index.ts` 和 `src/mock-data/manholes.ts`。
- 涉及实时刷新/性能问题时，优先检查 `src/App.tsx` 与 `src/hooks/useRealTimeData.ts`。
- 涉及地图问题时，先看 `src/config/mapConfig.ts`、`src/utils/mapLoader.ts`、`src/components/amap`、`src/components/ManholeMap.tsx`。
- 涉及 3D 问题时，先看 `src/components/3d-visualization`。
- 涉及预测/健康评分时，先看 `src/services/predictionService.ts` 和 `src/utils/healthScoreUtils.ts`。
- 涉及设置/主题时，先看 `SettingsContext` 和 `settingsUtils.ts`。

## 一句话总结

这是一个以合肥城市井盖为场景、以模拟数据驱动、融合地图与 3D 可视化的 React/TypeScript 智能运维数字孪生前端平台，重点在展示、监控、分析和运维工作台能力，而不是当前就绪的真实后端生产系统。
