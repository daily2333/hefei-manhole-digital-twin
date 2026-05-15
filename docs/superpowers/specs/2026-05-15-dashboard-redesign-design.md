# 综合仪表盘重新设计设计文档

## 1. 概述

### 1.1 目标
重新设计综合仪表盘，使其具备千万级项目的视觉品质，采用赛博朋克风格的大屏监控布局。

### 1.2 设计原则
- 不改变项目现有配色风格（深色科技风）
- 所有数据来源于后端API，不使用前端模拟数据
- 大气美观，适合千万级项目展示
- 信息层次清晰，核心指标一目了然

## 2. 布局结构

### 2.1 整体布局
```
┌─────────────────────────────────────────────────────────┐
│  智慧井盖数字孪生平台                    2026-05-15 14:30  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┤
│ 总数 │ 在线 │ 告警 │ 健康 │ 温度 │ 湿度 │ 水位 │ 气体   │
│  50  │  48  │  3   │  85  │ 25° │ 60% │ 12mm │ 正常   │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────┤
│                    系统运行状态仪表盘                    │
├─────────────────────────┬───────────────────────────────┤
│   设备状态分布（饼图）    │    告警趋势（折线图）          │
├─────────────────────────┼───────────────────────────────┤
│   区域统计（柱状图）      │    环境监测趋势（多线图）      │
├─────────────────────────┴───────────────────────────────┤
│                    实时告警列表                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 区域划分

#### 顶部区域（Header）
- 左侧：平台标题「智慧井盖数字孪生平台」
- 右侧：当前时间、刷新按钮

#### 核心指标卡（Metrics）
8个指标卡横向排列：
1. 设备总数（蓝色 #1890ff）
2. 在线设备（绿色 #52c41a）
3. 告警数量（红色 #ff4d4f）
4. 健康评分（青色 #32ccbc）
5. 平均温度（橙色 #faad14）
6. 平均湿度（紫色 #722ed1）
7. 平均水位（青色 #13c2c2）
8. 气体状态（绿色/红色，根据阈值变化）

#### 主图表区域（Charts）
- **第一行**：系统运行状态仪表盘（居中大尺寸，占满宽度）
- **第二行**：设备状态分布饼图（左） + 告警趋势折线图（右）
- **第三行**：区域统计柱状图（左） + 环境监测趋势图（右）

#### 底部区域（Footer）
- 实时告警列表（最近5条）

## 3. 数据来源

### 3.1 API接口

| 数据 | API端点 | 说明 |
|------|---------|------|
| 设备总数、状态分布 | `/stats/overview` | 设备概览数据 |
| 环境监测数据 | `/stats/realtime-summary` | 温湿度、水位、电池、信号平均值 |
| 告警趋势 | `/stats/alarm-trend` | 最近7天告警数量趋势 |
| 温湿度趋势 | `/stats/environment-summary` | 24小时温湿度变化 |
| 区域统计 | `/stats/district-summary` | 各区域井盖数量、告警、健康评分 |
| 气体分布 | `/stats/gas-distribution` | CH4、CO、H2S、O2平均浓度 |
| 告警列表 | `/api/alarms` | 最近告警记录 |

### 3.2 数据刷新策略
- 页面加载时获取所有数据
- 每30秒自动刷新实时数据
- 每5分钟刷新统计数据

## 4. 视觉效果（赛博朋克风格）

### 4.1 配色方案
- **背景**：深蓝渐变 `#0a0f1a` → `#0c1b30`
- **卡片背景**：`#162a45`（半透明）
- **边框发光**：`rgba(24, 144, 255, 0.3)` 蓝色发光
- **文字颜色**：主文字 `#fff`，次文字 `#8c8c8c`
- **图表配色**：使用项目现有配色（蓝、绿、红、青、橙）

### 4.2 交互效果
- 指标卡悬浮效果：hover时边框亮度增加，轻微上浮
- 数字动画：数字变化时有平滑过渡效果
- 图表动画：加载时有淡入效果

### 4.3 CSS样式
```css
/* 背景渐变 */
.dashboard-container {
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1b30 100%);
  min-height: 100vh;
}

/* 卡片样式 */
.dashboard-card {
  background: rgba(22, 42, 69, 0.8);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(24, 144, 255, 0.1);
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  border-color: rgba(24, 144, 255, 0.6);
  box-shadow: 0 0 30px rgba(24, 144, 255, 0.2);
  transform: translateY(-2px);
}

/* 指标卡样式 */
.metric-card {
  background: rgba(22, 42, 69, 0.6);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(22, 42, 69, 0.9);
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
}

.metric-label {
  font-size: 14px;
  color: #8c8c8c;
}
```

## 5. 组件结构

### 5.1 新组件文件
```
src/components/dashboard/
├── DashboardTab.tsx          # 原有组件（保留）
└── NewDashboardTab.tsx       # 新设计组件
```

### 5.2 组件接口
```typescript
interface NewDashboardTabProps {
  manholes: ManholeInfo[];
  alarms: ManholeAlarm[];
  selectedManhole: ManholeInfo | null;
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole: (manhole: ManholeInfo) => void;
  loading?: boolean;
  onRefresh?: () => void;
}
```

### 5.3 内部状态
```typescript
interface DashboardData {
  // 概览数据
  overview: {
    totalManholes: number;
    statusDistribution: Record<string, number>;
    unresolvedAlarms: number;
    pendingMaintenance: number;
    averageHealthScore: number;
  };
  // 实时摘要
  realtimeSummary: {
    avg_temp: number;
    avg_humidity: number;
    avg_water: number;
    avg_battery: number;
    avg_signal: number;
  };
  // 告警趋势
  alarmTrend: Array<{ date: string; count: number }>;
  // 环境数据
  environmentSummary: EnvironmentSummary;
  // 区域统计
  districtSummary: DistrictSummary;
  // 气体分布
  gasDistribution: GasDistribution;
}
```

## 6. 实现计划

### 6.1 步骤1：创建新组件文件
- 创建 `NewDashboardTab.tsx`
- 定义组件接口和状态类型

### 6.2 步骤2：实现数据获取
- 使用 `useEffect` 和 `useState` 获取后端数据
- 调用 `/stats/*` 系列API

### 6.3 步骤3：实现布局结构
- 顶部Header区域
- 核心指标卡区域
- 主图表区域
- 底部告警列表

### 6.4 步骤4：实现图表组件
- 系统运行状态仪表盘（ECharts gauge）
- 设备状态分布饼图（ECharts pie）
- 告警趋势折线图（ECharts line）
- 区域统计柱状图（ECharts bar）
- 环境监测趋势图（ECharts line）

### 6.5 步骤5：应用赛博朋克样式
- 实现CSS样式
- 添加动画效果

### 6.6 步骤6：集成到主应用
- 修改 `MainContent.tsx` 使用新组件
- 测试验证

## 7. 测试验证

### 7.1 功能测试
- 验证所有数据正确显示
- 验证图表交互正常
- 验证刷新功能正常

### 7.2 视觉测试
- 验证赛博朋克风格效果
- 验证响应式布局
- 验证动画效果

## 8. 注意事项

### 8.1 性能优化
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存回调函数
- 避免不必要的重渲染

### 8.2 错误处理
- API请求失败时显示友好提示
- 数据为空时显示占位符

### 8.3 代码规范
- 遵循项目现有代码风格
- 使用TypeScript类型定义
- 添加必要的注释
