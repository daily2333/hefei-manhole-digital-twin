# 智能井盖数字孪生 - 架构图表

本目录包含智能井盖数字孪生项目的17张架构图表。

## 图表文件列表

### 系统架构图（3张）
| 编号 | 文件名 | 说明 |
|------|--------|------|
| 01 | `01-system-architecture.drawio` | 系统总体架构 — 5层分层（客户端/接口/服务/数据/设备） |
| 02 | `02-tech-stack.drawio` | 技术栈架构 — 前端/后端/工具组件 |
| 03 | `03-data-flow.drawio` | 数据流架构 — MQTT→SQLite→REST→React路径 |

### 时序图（4张）
| 编号 | 文件名 | 说明 |
|------|--------|------|
| 04 | `04-login-sequence.drawio` | 用户登录认证流程（JWT） |
| 05 | `05-rest-api-sequence.drawio` | REST API调用流程（含错误处理） |
| 06 | `06-websocket-sequence.drawio` | WebSocket实时推送流程 |
| 07 | `07-mqtt-data-sequence.drawio` | MQTT数据采集流程 |

### 算法流程图（5张）
| 编号 | 文件名 | 说明 |
|------|--------|------|
| 08 | `08-prediction-algorithm.drawio` | 预测算法（线性回归） |
| 09 | `09-anomaly-detection.drawio` | 异常检测（Z分数阈值） |
| 10 | `10-health-score.drawio` | 健康评分计算（加权公式） |
| 11 | `11-batch-processing.drawio` | 数据批处理（requestIdleCallback） |
| 12 | `12-cache-strategy.drawio` | 缓存更新策略 |

### 甘特图（5张）
| 编号 | 文件名 | 说明 |
|------|--------|------|
| 13 | `13-frontend-gantt.drawio` | 前端模块开发计划 |
| 14 | `14-backend-gantt.drawio` | 后端模块开发计划 |
| 15 | `15-3d-visualization-gantt.drawio` | 3D可视化模块开发计划 |
| 16 | `16-map-system-gantt.drawio` | 地图系统模块开发计划 |
| 17 | `17-iot-integration-gantt.drawio` | IoT集成模块开发计划 |

## 查看方式

### 方式一：浏览器查看（无需安装）
打开 `browser-urls.md` 文件，点击链接即可在浏览器中直接查看图表。
- 完全在客户端运行
- 不会上传任何数据到服务器
- 可以在线编辑和导出

### 方式二：Draw.io桌面版（推荐）
1. 下载安装 draw.io：https://github.com/jgraph/drawio-desktop/releases
2. 双击任意 `.drawio` 文件即可打开编辑
3. 可导出为 PNG/SVG/PDF 格式

### 方式三：批量导出（安装Draw.io后）
运行以下脚本可批量导出所有图表为 PNG 和 SVG 格式：

**Windows命令提示符：**
```cmd
export-all.bat
```

**PowerShell：**
```powershell
.\export-all.ps1
```

## 导出格式

每个 `.drawio` 文件可导出为以下格式：
- **PNG** — 位图格式（2倍缩放，清晰度高）
- **SVG** — 矢量格式（可无损缩放）
- **PDF** — 打印格式

导出脚本会生成：
- `{名称}.drawio.png` — 嵌入XML的PNG（可在draw.io中编辑）
- `{名称}.svg` — 嵌入XML的SVG

## 图表统计

- **图表总数：** 17张
- **文件格式：** draw.io XML
- **布局方式：** TB（从上到下）、LR（从左到右）
- **配色方案：** 按层级配色（蓝色=客户端，橙色=接口，紫色=服务，绿色=数据）

## 图表规范

### 架构图
- **泳道** — 层级分组
- **圆角矩形** — 服务和模块
- **圆柱体** — 数据库
- **虚线边框** — 外部系统
- **动画连接器** — 数据流路径

### 时序图
- **生命线** — 参与者时间线
- **实线箭头** — 同步消息
- **虚线箭头** — 异步/返回消息
- **激活框** — 处理时间段
- **Alt/Par框** — 控制流

### 流程图
- **绿色椭圆** — 开始/结束
- **蓝色矩形** — 处理步骤
- **黄色菱形** — 决策判断
- **橙色平行四边形** — 输入/输出
- **紫色框** — 子流程/公式

### 甘特图
- **水平条** — 任务持续时间
- **泳道** — 项目阶段
- **虚线箭头** — 任务依赖
- **里程碑标记** — 关键交付物
