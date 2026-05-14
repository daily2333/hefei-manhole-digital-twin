# 智能井盖生产化第一阶段蓝图

## 当前阶段目标

- 把现有前端演示平台整理为可接入真实后端的数据消费端
- 建立后端生产骨架、数据库模型与接口边界
- 保留 `mock` 回退能力，避免重构期间前端不可用

## 系统拆分

### 前端

- `React + TypeScript + Ant Design`
- 通过 `src/services/api` 访问后端
- 支持 `REACT_APP_DATA_SOURCE=mock|api`

### 后端

- `NestJS`
- `PostgreSQL` 存储主业务数据
- `Redis` 用于缓存、会话与实时事件辅助
- 通过 REST API 提供业务接口
- 后续通过 WebSocket / MQTT 增加实时推送和设备接入

## 第一阶段领域模型

- `users`: 用户
- `roles`: 角色
- `manholes`: 井盖资产
- `devices`: 设备信息
- `telemetry_records`: 遥测数据
- `alarms`: 告警记录
- `maintenance_records`: 维护工单
- `operation_logs`: 操作审计

## 第一阶段 API 边界

- `GET /api/v1/health`
- `GET /api/v1/manholes`
- `GET /api/v1/manholes/:id`
- `GET /api/v1/dashboard/bootstrap`
- `GET /api/v1/alarms`
- `GET /api/v1/maintenance-records`

## 前端切换策略

- 默认仍支持 `mock`
- 当 `REACT_APP_DATA_SOURCE=api` 时，前端优先请求真实后端
- 若真实后端不可用，首版先回退到 mock，保证大屏仍可运行

## 后续阶段

1. 完成登录、RBAC、JWT
2. 补齐数据库迁移和种子数据
3. 替换 `alarm-management`、`device-management`、`maintenance` 等模块直连 mock 的逻辑
4. 增加 MQTT 设备接入与实时推送
