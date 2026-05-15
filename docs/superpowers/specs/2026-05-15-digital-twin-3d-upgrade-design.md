# Digital Twin 3D Visualization Upgrade — Design Spec

> **Date:** 2026-05-15
> **Status:** Approved
> **Scope:** 3D 可视化页面全面升级，对标国际一流数字孪生项目

## Goal

将当前低质量的 3D 井盖可视化升级为科幻 HUD 风格的数字孪生场景，包含精细井盖模型、后处理管线（Bloom/SSAO）、科幻城市底图、昼夜切换。

## Current Problems

1. 井盖模型是纯圆柱体（`CylinderGeometry`），无纹理无细节
2. "地图"是 Canvas 手绘的粗糙网格线，不是真实地图
3. 50 个井盖只渲染 15 个（`manholes.slice(0, 15)`）
4. 标志建筑是无纹理的纯色方块
5. 无后处理效果（无 Bloom、无 SSAO）
6. 无 HDR 环境贴图
7. 大量死代码（`ManholeScene.tsx`、`ManholeCover3D.tsx`、`GeoManholeScene.tsx` 均未使用）
8. 高德地图组件已被删除，地图功能缺失
9. 内存泄漏（动画循环未清理）
10. vanilla Three.js 架构与 React 状态系统集成困难

## Architecture

### Technology Stack

- **React Three Fiber** (`@react-three/fiber` ^8.15.12) — 已有
- **drei** (`@react-three/drei` ^9.92.7) — 已有
- **postprocessing** (`@react-three/postprocessing` ^2.16.0) — **新增**
- **postprocessing** (`postprocessing` ^6.36.0) — **新增**（peer dependency）

### Component Tree

```
ManholeSceneWrapper (重写 — UI 壳 + HUD)
├─ HUDOverlay (HTML overlay, position: absolute)
│   ├─ 左上: 标题 + 时间
│   ├─ 右上: 状态统计 (在线/告警/离线)
│   └─ 底部: 昼夜切换 + FPS
└─ Canvas (R3F)
    ├─ Environment (HDR ambient light)
    ├─ SciFiGround (网格地面 + 道路光带)
    ├─ CityBuildings (建筑轮廓发光线条)
    ├─ ManholeModel x50 (精细 PBR 模型)
    ├─ StatusIndicator x50 (状态灯 + 光柱)
    ├─ SceneEffects (Bloom + SSAO + Vignette + ToneMapping)
    ├─ OrbitControls (阻尼 + 距离/角度限制)
    └─ 点击交互 (raycaster)
```

### Data Flow

```
App.tsx (manholes, realTimeDataMap, selectedManhole, onSelectManhole)
  └─ MainContent.tsx
       └─ ManholeSceneWrapper.tsx
            ├─ HUDOverlay ← 统计数据 (computed from manholes)
            └─ DigitalTwinScene.tsx
                 ├─ props: manholes, realTimeDataMap, selectedManhole, onSelectManhole, isNightMode
                 ├─ 渲染 50 个 ManholeModel
                 └─ 每个 ManholeModel 根据 status + realTimeData 决定颜色/动画
```

## File Structure

### Files to Delete (Dead Code)

| File | Reason |
|------|--------|
| `src/components/3d-visualization/ManholeScene.tsx` | 未被任何组件引用 |
| `src/components/3d-visualization/ManholeCover3D.tsx` | 仅被已死组件引用 |
| `src/components/3d-visualization/GeoManholeScene.tsx` | 未被任何组件引用 |
| `src/components/3d-visualization/ManholeSceneWrapper.tsx` | 将被新版本完全替代 |

### Files to Create

| File | Responsibility |
|------|---------------|
| `src/components/3d-visualization/DigitalTwinScene.tsx` | 主 R3F 场景：Canvas、环境光、交互、子组件编排 |
| `src/components/3d-visualization/SciFiGround.tsx` | 科幻网格地面 + 道路光带 + 区域标注 |
| `src/components/3d-visualization/CityBuildings.tsx` | 合肥建筑轮廓发光线条 |
| `src/components/3d-visualization/ManholeModel.tsx` | 单个井盖的精细 3D 模型 |
| `src/components/3d-visualization/StatusIndicator.tsx` | 井盖状态指示灯 + 信标光柱 |
| `src/components/3d-visualization/SceneEffects.tsx` | 后处理管线 (Bloom, SSAO, Vignette, ToneMapping) |
| `src/components/3d-visualization/HUDOverlay.tsx` | HTML 覆盖层 (标题、统计、昼夜切换) |
| `src/components/3d-visualization/types.ts` | 3D 场景专用类型定义 |

### Files to Modify

| File | Change |
|------|--------|
| `package.json` | 新增 `@react-three/postprocessing` + `postprocessing` |
| `src/components/dashboard/MainContent.tsx` | 更新 3D 可视化 tab 的 import 路径 |
| `src/components/prediction/PredictionAnalytics.tsx` | 更新 import 路径从 `HefeiManholeScene` 到 `DigitalTwinScene`（props 接口兼容，无需改逻辑） |

### Files to Preserve (No Changes)

| File | Reason |
|------|--------|
| `src/components/3d-visualization/HefeiManholeScene.tsx` | 保留作为 fallback，不再被主路由引用 |

## Visual Design

### 2.1 SciFiGround — 科幻地面

- **网格地面**：80×80 PlaneGeometry，自定义 shader 绘制发光网格线
  - 夜间：深蓝黑底 (#0a1525) + 青色网格线 (#00ffff, opacity 0.3)
  - 白天：灰蓝底 (#1a2535) + 淡蓝网格线 (#4a8fff, opacity 0.2)
  - 网格间距：2 单位（对应约 200 米）
- **道路光带**：TubeGeometry 沿合肥主要道路路径
  - 材质：MeshBasicMaterial + emissive 青色
  - 道路数据：硬编码长江路、淮河路、黄山路、环城路等主干道的简化坐标
  - 夜间发光强，白天发光弱
- **区域标注**：drei `Text` 组件在地面投影区域名称
  - 蜀山区、庐阳区、包河区、瑶海区、滨湖新区
  - 字体大小随距离缩放

### 2.2 CityBuildings — 建筑轮廓

- 使用 `Line` (drei) 绘制合肥主要建筑群的 2D 轮廓
- 坐标来源：从真实建筑 footprint 简化为多边形顶点
- 发光线条材质：LineBasicMaterial + emissive
- 高度信息：竖直线条表示建筑高度
- 标志建筑（市政府、火车站、滨湖新区）用更亮颜色 + 更高轮廓
- 夜间：青色发光 (#00ffff)
- 白天：淡蓝发光 (#4a8fff)

### 2.3 ManholeModel — 精细井盖模型

几何结构：
- **盖板**：CylinderGeometry(0.5, 0.5, 0.08, 32) — 圆形主体
- **防滑纹路**：通过 Normal Map 实现（不增加几何复杂度）
- **螺栓孔**：6 个 CylinderGeometry(0.03, 0.03, 0.1, 8) 均匀分布
- **边框**：TorusGeometry(0.52, 0.03, 8, 32) — 外圈金属边框
- **底部井筒**：CylinderGeometry(0.45, 0.45, 0.3, 32, 1, true) — 可见圆筒内壁
- **状态指示**：StatusIndicator 组件（灯球 + 光柱）

材质 (PBR)：
- 金属度 (metalness): 0.85
- 粗糙度 (roughness): 0.25
- 颜色: 深灰 (#2a2a2a)
- Emissive: 状态色 × 强度
  - 正常: 绿色 (#00ff88) × 0.3
  - 告警: 黄色 (#ffaa00) × 0.5
  - 严重告警: 红色 (#ff3333) × 0.8
  - 离线: 灰色 (#666666) × 0.0

状态动画 (useFrame)：
- 告警井盖：emissive 强度脉冲 `0.5 + sin(time * 3) * 0.3`
- 选中井盖：轻微上下浮动 `y += sin(time * 2) * 0.05`
- 离线井盖：无动画

### 2.4 StatusIndicator — 状态指示

- **灯球**：SphereGeometry(0.08) 在井盖上方 0.3 单位
  - MeshBasicMaterial + emissive 状态色
  - 夜间：高亮度
  - 白天：低亮度
- **信标光柱**：CylinderGeometry(0.02, 0.15, 1.5, 8)
  - MeshBasicMaterial + transparent + opacity 0.3
  - 状态色，告警时更明显
  - 仅非离线状态显示

### 2.5 SceneEffects — 后处理管线

使用 `@react-three/postprocessing`：

```tsx
<EffectComposer>
  <Bloom
    luminanceThreshold={0.8}
    luminanceSmoothing={0.3}
    intensity={nightMode ? 1.5 : 0.5}
    radius={0.4}
  />
  <SSAO
    radius={0.5}
    intensity={0.3}
    luminanceInfluence={0.5}
  />
  <Vignette
    offset={0.3}
    darkness={nightMode ? 0.7 : 0.3}
  />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>
```

### 2.6 昼夜切换

- **夜间模式**：深蓝黑背景，强 Bloom (1.5)，青色主色调，所有 emissive 高亮度
- **白天模式**：浅灰蓝背景，弱 Bloom (0.5)，暖白主色调，减少 emissive
- **过渡动画**：1.5 秒 lerp 插值
  - 背景色：lerp RGB
  - Bloom 强度：lerp scalar
  - 灯光强度：lerp scalar
  - SSAO 强度：lerp scalar
  - Vignette 暗度：lerp scalar

## Interaction Design

### Camera Controls

- OrbitControls (drei):
  - 阻尼 (enableDamping): true
  - 最小距离 (minDistance): 5
  - 最大距离 (maxDistance): 50
  - 最大极角 (maxPolarAngle): Math.PI / 2.2（防止看到地下）
  - 自动旋转: 关闭

### Manhole Interaction

- **Hover**: emissive 强度增加 50% + 名称 tooltip (drei `Html`)
- **Click**: 选中井盖
  - 底部出现选中光环 (RingGeometry + emissive 脉冲)
  - 相机平滑飞到该井盖附近 (lerp in useFrame)
  - 右侧弹出详情面板 (HTML overlay)
- **Double-click empty**: 回到默认鸟瞰视角

### HUD Overlay

HTML overlay (position: absolute, pointer-events: none on background):

```
┌─────────────────────────────────────────────────────┐
│ 合肥智慧井盖数字孪生          🟢 42 在线  🟡 5 告警  🔴 3 离线 │
│                                    │
│                                    │
│         [3D Canvas]                │
│                                    │
│                                    │
│           [☀️/🌙 切换]  FPS: 60     │
└─────────────────────────────────────────────────────┘
```

## Props Interface

`DigitalTwinScene` 和 `ManholeSceneWrapper` 保持与 `HefeiManholeScene` 相同的 props 接口，确保 `PredictionAnalytics.tsx` 无需修改：

```typescript
interface DigitalTwinSceneProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}
```

`ManholeSceneWrapper` 对外接口保持不变，内部实现完全重写。

### Props Consumers

| Consumer | Import Target | Props Used |
|----------|--------------|------------|
| `MainContent.tsx` | `ManholeSceneWrapper` (lazy) | manholes, realTimeDataMap, onSelectManhole, selectedManholeId |
| `PredictionAnalytics.tsx` | `HefeiManholeScene` → 改为 `DigitalTwinScene` | manholes, realTimeDataMap, onSelectManhole, selectedManholeId, isNightMode |

## Anti-Patterns to Avoid

1. 不要在 `useFrame` 中创建新对象（会导致 GC 压力）
2. 不要在每次渲染时创建新的 `Vector3`/`Color` 实例（使用 `useRef` 或 `useMemo`）
3. 不要使用 `requestAnimationFrame` 手动循环（R3F 的 `useFrame` 自动管理）
4. 不要在组件卸载后更新状态（使用 `useEffect` cleanup）
5. 不要硬编码像素值（使用相对单位）

## Dependencies

### New Dependencies

```json
{
  "@react-three/postprocessing": "^2.16.0",
  "postprocessing": "^6.36.0"
}
```

### Dependencies to Remove

```json
{
  "@amap/amap-react": "unused"
}
```

## Success Criteria

1. 所有 50 个井盖在场景中可见
2. 井盖模型有明显的螺栓孔、防滑纹路、金属质感
3. Bloom 效果让 emissive 材质发光
4. SSAO 增加接触阴影深度感
5. 昼夜切换有 1.5 秒平滑过渡
6. 点击井盖有选中高亮 + 相机飞入
7. 场景在中端 GPU 上保持 60fps
8. 无内存泄漏（R3F 自动管理）
9. 无死代码残留
