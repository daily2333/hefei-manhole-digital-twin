/**
 * 井盖基本信息接口
 */
export interface ManholeInfo {
  id: string;
  name: string;
  status: ManholeStatus;
  location: Location;
  model: string;
  manufacturer: string;
  installationDate: string;
  material: string;
  diameter: number;
  depth: number;
  manager: string;
  contactPhone: string;
  lastMaintenanceTime?: string;
  nextMaintenanceTime?: string;
  deviceId: string;
  sensorTypes: string[];
  batteryReplaceDate?: string;
  notes?: string;
  latestAlarm?: ManholeAlarm;
  latestMaintenance?: MaintenanceRecord;
  latestData?: ManholeRealTimeData;
  healthScore?: HealthScore;
}

/**
 * 井盖状态枚举
 */
export enum ManholeStatus {
  Normal = '正常',
  Warning = '警告',
  Alarm = '告警',
  Offline = '离线',
  Maintenance = '维护中'
}

/**
 * 井盖实时数据接口
 */
export interface ManholeRealTimeData {
  id: string;
  manholeId: string;
  timestamp: string;
  waterLevel: number;
  gasConcentration: {
    ch4: number;
    co: number;
    h2s: number;
    o2: number;
  };
  temperature: number;
  humidity: number;
  batteryLevel: number;
  signalStrength: number;
  coverStatus: CoverStatus;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  tilt: {
    pitch: number;
    roll: number;
  };
  accuracy: {
    temperature: number;
    waterLevel: number;
  };
}

/**
 * 井盖盖子状态枚举
 */
export enum CoverStatus {
  Closed = '关闭',
  Open = '开启',
  PartialOpen = '部分开启',
  Unknown = '未知'
}

/**
 * 告警信息接口
 */
export interface ManholeAlarm {
  id: string;
  manholeId: string;
  time: string;
  type: AlarmType;
  level: AlarmLevel;
  description: string;
  isResolved: boolean;
  resolvedTime?: string;
  resolvedBy?: string;
  resolveNote?: string;
  pushTime?: string;
  acknowledgeTime?: string;
  anomalyScore?: number;
  normalRange?: [number, number];
  actualValue?: number;
}

/**
 * 告警类型枚举
 */
export enum AlarmType {
  WaterLevel = '水位异常',
  GasLevel = '气体浓度异常',
  Temperature = '温度异常',
  BatteryLow = '电池电量低',
  CoverOpen = '井盖开启',
  SignalLoss = '信号丢失',
  Vibration = '振动异常',
  Tilt = '倾斜异常',
  Custom = '自定义告警'
}

/**
 * 告警级别枚举 - 五级告警分类体系
 */
export enum AlarmLevel {
  Info = '信息',
  Notice = '提醒',
  Warning = '警告',
  Alert = '严重',
  Emergency = '紧急'
}

/**
 * 维护记录接口
 */
export interface MaintenanceRecord {
  id: string;
  manholeId: string;
  time: string;
  type: MaintenanceType;
  description: string;
  operatorName: string;
  contactPhone: string;
  completionTime?: string;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  notes?: string;
  images?: string[];
}

/**
 * 维护类型枚举
 */
export enum MaintenanceType {
  Routine = '日常检查',
  Repair = '故障维修',
  Replacement = '设备更换',
  Calibration = '设备校准',
  Cleaning = '清理',
  SystemUpgrade = '系统升级'
}

/**
 * 井盖位置信息接口
 */
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  city: string;
  province: string;
}

/**
 * 加权健康评分模型
 * 健康评分 = 0.4 * 传感器状态 + 0.3 * 电池状态 + 0.3 * 通信状态
 */
export interface HealthScore {
  total: number;
  sensorScore: number;
  batteryScore: number;
  communicationScore: number;
  lastUpdated: string;
  trend: 'rising' | 'falling' | 'stable';
  history: HealthScoreRecord[];
}

/**
 * 健康评分历史记录
 */
export interface HealthScoreRecord {
  timestamp: string;
  score: number;
}

/**
 * 异常检测配置接口
 */
export interface AnomalyDetectionConfig {
  enabled: boolean;
  zScoreThreshold: number;
  minDataPoints: number;
  responseTimeMs: number;
}

/**
 * 三维场景配置
 */
export interface Scene3DConfig {
  maxInstanceCount: number;
  loadTimeoutMs: number;
  targetFPS: number;
  instancingEnabled: boolean;
  lodLevels: number;
  shadowMapSize?: number;
  useSimplifiedGeometry?: boolean;
  raycastThrottleMs?: number;
} 