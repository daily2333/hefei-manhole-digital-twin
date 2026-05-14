import { ManholeInfo, ManholeStatus, ManholeRealTimeData, CoverStatus, ManholeAlarm, AlarmType, AlarmLevel, MaintenanceRecord, MaintenanceType, Location, HealthScore, HealthScoreRecord } from '../typings';
import { calculateHealthScore } from '../utils/healthScoreUtils';
import { detectAnomaly, determineAlarmLevel } from '../utils/alarmUtils';

/**
 * 生成随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 生成随机浮点数
 * @param min 最小值
 * @param max 最大值
 * @param decimals 小数位数
 * @returns 随机浮点数
 */
const getRandomFloat = (min: number, max: number, decimals: number = 2): number => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

/**
 * 生成随机日期字符串
 * @param start 开始日期
 * @param end 结束日期
 * @returns 日期字符串
 */
const getRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

/**
 * 从数组中随机选择一个元素
 * @param array 数组
 * @returns 随机选择的元素
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID
 */
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 生成合肥市周边的随机位置
 * @returns 位置信息
 */
const generateRandomLocation = (): Location => {
  // 合肥市中心坐标：117.27, 31.86
  const centralLongitude = 117.27;
  const centralLatitude = 31.86;
  
  // 在中心点周围随机生成坐标（范围约10公里内）
  const offsetLon = getRandomFloat(-0.1, 0.1, 6);
  const offsetLat = getRandomFloat(-0.1, 0.1, 6);
  
  const longitude = centralLongitude + offsetLon;
  const latitude = centralLatitude + offsetLat;
  
  // 生成随机地址
  const districts = ['蜀山区', '庐阳区', '包河区', '瑶海区', '新站区', '经开区', '高新区', '滨湖区'];
  const roads = ['长江路', '黄山路', '合作化路', '徽州大道', '望江路', '科学大道', '繁华大道', '习友路', '南宁路', '金寨路'];
  const district = getRandomElement(districts);
  const road = getRandomElement(roads);
  const number = getRandomInt(1, 1000);
  
  return {
    longitude,
    latitude,
    address: `合肥市${district}${road}${number}号附近`,
    district,
    city: '合肥市',
    province: '安徽省'
  };
};

/**
 * 生成模拟井盖数据
 * @param count 生成数量
 * @returns 井盖数据数组
 */
export const generateMockManholes = (count: number): ManholeInfo[] => {
  const manholes: ManholeInfo[] = [];
  
  const manufacturers = ['格栅智能', '华为', '海康威视', '大华', '智敏科技', '博为科技'];
  const models = ['MH-001', 'MH-200', 'MH-Pro', 'Smart-T3', 'iCover-X5', 'iCover-G9'];
  const materials = ['球墨铸铁', '复合材料', '钢筋混凝土', '钢纤维混凝土', '铝合金'];
  const managers = ['张工', '李工', '王工', '赵工', '刘工', '孙工'];
  const sensorTypes = ['温度传感器', '湿度传感器', '气体传感器', '水位传感器', '振动传感器', '倾斜传感器', '位移传感器', '红外传感器'];
  
  for (let i = 0; i < count; i++) {
    // 生成状态，大部分应该是正常的
    let status: ManholeStatus;
    const rand = Math.random();
    if (rand < 0.6) {
      status = ManholeStatus.Normal;
    } else if (rand < 0.75) {
      status = ManholeStatus.Warning;
    } else if (rand < 0.85) {
      status = ManholeStatus.Alarm;
    } else if (rand < 0.9) {
      status = ManholeStatus.Maintenance;
    } else {
      status = ManholeStatus.Offline;
    }
    
    // 从可选值中随机选择规格参数
    const manufacturer = getRandomElement(manufacturers);
    const model = getRandomElement(models);
    const material = getRandomElement(materials);
    const diameter = getRandomInt(600, 1000); // 井盖直径，单位mm
    const depth = getRandomInt(1000, 3000);   // 井深，单位mm
    const location = generateRandomLocation();
    const manager = getRandomElement(managers);
    
    // 随机选择2-5种传感器
    const selectedSensors: string[] = [];
    const sensorCount = getRandomInt(2, 5);
    for (let j = 0; j < sensorCount; j++) {
      const sensor = getRandomElement(sensorTypes);
      if (!selectedSensors.includes(sensor)) {
        selectedSensors.push(sensor);
      }
    }
    
    // 生成时间
    const now = new Date();
    const installationDate = getRandomDate(new Date(now.getFullYear() - 5, 0, 1), new Date(now.getFullYear(), now.getMonth(), 1));
    const lastMaintenanceTime = getRandomDate(new Date(now.getFullYear(), now.getMonth() - 6, 1), now);
    
    // 下次维护时间
    const nextMaintenanceDate = new Date(now);
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + getRandomInt(1, 6));
    const nextMaintenanceTime = nextMaintenanceDate.toISOString();
    
    // 生成井盖信息
    const manhole: ManholeInfo = {
      id: `MH${String(i + 1).padStart(4, '0')}`,
      name: `智能井盖_${String(i + 1).padStart(4, '0')}`,
      status,
      location,
      model,
      manufacturer,
      installationDate,
      material,
      diameter,
      depth,
      manager,
      contactPhone: `1391234${String(getRandomInt(1000, 9999))}`,
      lastMaintenanceTime,
      nextMaintenanceTime,
      deviceId: `DEV${String(i + 1).padStart(4, '0')}`,
      sensorTypes: selectedSensors,
      batteryReplaceDate: getRandomDate(new Date(now.getFullYear() - 1, 0, 1), now),
      notes: Math.random() > 0.7 ? `井盖${i + 1}的备注信息` : undefined
    };
    
    manholes.push(manhole);
  }
  
  return manholes;
};

// 保存上次生成的数据，用于下次生成时作为基础
const lastGeneratedData: Map<string, ManholeRealTimeData> = new Map();

// 添加一个基于种子的确定性随机数生成函数
const generateDeterministicRandom = (seed: number): number => {
  // 简单的伪随机数生成算法
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)); // 返回0-1之间的值
};

// 添加一个生成-1到1之间确定性随机值的函数
const generateDeterministicChange = (seed: number, maxChange: number): number => {
  return (generateDeterministicRandom(seed) * 2 - 1) * maxChange;
};

/**
 * 生成模拟的井盖实时数据
 * @param manholeId 井盖ID
 * @param statusOverride 覆盖状态
 * @returns 井盖实时数据
 */
export const generateMockRealTimeData = (manholeId: string, statusOverride?: ManholeStatus): ManholeRealTimeData => {
  const now = new Date();
  
  // 使用当前时间戳的小时部分作为种子，确保同一小时内数据保持稳定
  // 只使用小时级别的时间戳，确保数据在一小时内不会变化
  const hourTimestamp = Math.floor(now.getTime() / 3600000);
  const idNumber = parseInt(manholeId.replace(/\D/g, '')) || 0;
  const baseSeed = idNumber * 1000 + hourTimestamp;
  
  // 获取上次的数据作为基础，如果没有则使用默认值
  const lastData = lastGeneratedData.get(manholeId);
  
  // 获取季节因子 (0-春, 1-夏, 2-秋, 3-冬)
  const month = now.getMonth(); // 0-11
  const season = Math.floor(((month + 1) % 12) / 3); // 将月份映射到季节
  
  // 获取一天中的时间因子 (0-23小时)
  const hour = now.getHours();
  
  // 计算日周期温度因子 (-1到1)，中午最高，凌晨最低
  const dayTempFactor = Math.sin((hour - 6) * Math.PI / 12);
  
  // 计算季节温度基线
  const seasonBaseline = season === 0 ? 15 : // 春季
                        season === 1 ? 25 : // 夏季
                        season === 2 ? 18 : // 秋季
                        5; // 冬季
  
  // 根据状态调整参数范围
  let tempRange = [seasonBaseline - 5, seasonBaseline + 10];  // 季节性温度范围
  let humidityRange = [20, 60]; // 正常湿度范围
  let gasRange = [0, 100];   // 正常气体浓度范围
  let waterRange = [0, 50];  // 正常水位范围
  let batteryRange = [60, 100]; // 正常电池范围
  let signalRange = [60, 100]; // 正常信号范围
  let coverStatus = CoverStatus.Closed;
  
  // 基于覆盖状态调整参数
  if (statusOverride) {
    switch (statusOverride) {
      case ManholeStatus.Warning:
        // 警告状态下，参数稍微偏离正常范围
        tempRange = [tempRange[1] - 2, tempRange[1] + 5];
        humidityRange = [60, 80];
        gasRange = [100, 200];
        waterRange = [50, 150];
        batteryRange = [30, 50];
        signalRange = [30, 50];
        coverStatus = CoverStatus.PartialOpen;
        break;
      case ManholeStatus.Alarm:
        // 告警状态下，参数严重偏离正常范围
        tempRange = [tempRange[1] + 3, tempRange[1] + 15];
        humidityRange = [80, 100];
        gasRange = [200, 500];
        waterRange = [150, 300];
        batteryRange = [10, 30];
        signalRange = [10, 30];
        coverStatus = CoverStatus.Open;
        break;
      case ManholeStatus.Maintenance:
        // 维护状态下，参数正常，但井盖可能开启
        coverStatus = CoverStatus.Open;
        break;
      case ManholeStatus.Offline:
        // 离线状态下，信号极低或没有
        signalRange = [0, 10];
        batteryRange = [0, 20];
        break;
    }
  }
  
  // 进一步降低变化率，使数据更加稳定
  // 温度每次最多变化±0.02°C
  const maxTempChange = 0.02;
  // 湿度每次最多变化±0.05%
  const maxHumidityChange = 0.05;
  // 水位每次最多变化±0.1mm
  const maxWaterLevelChange = 0.1;
  // 气体浓度每次最多变化±0.1ppm
  const maxGasChange = 0.1;
  // 电池电量每次最多减少0.0005%（几乎不变）
  const maxBatteryChange = 0.0005;
  // 信号强度每次最多变化±0.02%
  const maxSignalChange = 0.02;
  
  // 基于上次数据或初始化基准值
  let temperature: number;
  let humidity: number;
  let waterLevel: number;
  let gasCh4: number;
  let batteryLevel: number;
  let signalStrength: number;
  
  if (lastData) {
    // 使用确定性随机算法，保证相同的井盖ID在相同小时内生成相同的数据
    // 为每个参数使用不同的种子以避免相同的变化模式
    
    // 温度变化考虑日周期变化和季节变化
    const tempDirection = dayTempFactor > 0 ? 1 : -1; // 白天温度上升，夜间温度下降
    const tempChangeMagnitude = Math.abs(dayTempFactor) * maxTempChange; // 变化幅度与日周期相关
    temperature = lastData.temperature + tempDirection * tempChangeMagnitude;
    
    // 湿度变化与温度负相关
    const humidityDirection = dayTempFactor > 0 ? -1 : 1; // 温度上升时湿度下降，反之亦然
    humidity = lastData.humidity + humidityDirection * Math.abs(dayTempFactor) * maxHumidityChange;
    
    // 水位可能与降雨相关，这里简化处理
    // 雨季（春夏）可能水位略高
    const isRainySeason = season === 0 || season === 1;
    const waterLevelBase = isRainySeason ? maxWaterLevelChange : maxWaterLevelChange * 0.5;
    waterLevel = lastData.waterLevel + generateDeterministicChange(baseSeed + 3, waterLevelBase);
    
    // 气体浓度变化
    gasCh4 = lastData.gasConcentration.ch4 + generateDeterministicChange(baseSeed + 4, maxGasChange);
    
    // 电池电量随时间缓慢减少，几乎不变
    // 使用确定性因子，每天减少非常小的量
    const dayFactor = Math.floor(now.getTime() / 86400000); // 天数
    // 不同季节电池消耗不同 - 冬季消耗更多
    const seasonBatteryFactor = season === 3 ? 1.5 : 1.0;
    batteryLevel = lastData.batteryLevel - Math.abs(generateDeterministicChange(baseSeed + dayFactor, maxBatteryChange * seasonBatteryFactor));
    
    // 信号强度可能受天气影响 - 简化处理
    const weatherEffect = (season === 1 || season === 2) ? 1.0 : 1.2; // 夏秋季信号较好
    signalStrength = lastData.signalStrength + generateDeterministicChange(baseSeed + 6, maxSignalChange * weatherEffect);
  } else {
    // 首次生成数据，使用基于ID的确定性基准值
    // 使用确定性函数初始化数值，确保相同ID的设备每次生成相同的初始值
    const tempSeed = baseSeed + 100;
    const humiditySeed = baseSeed + 200;
    const waterLevelSeed = baseSeed + 300;
    const gasSeed = baseSeed + 400;
    const batterySeed = baseSeed + 500;
    const signalSeed = baseSeed + 600;
    
    // 初始值考虑季节因素
    const seasonTempBase = seasonBaseline;
    const tempRange = [seasonTempBase - 5, seasonTempBase + 10];
    
    // 湿度受季节影响
    const seasonHumidityBase = season === 1 ? 60 : // 夏季湿度高
                             season === 3 ? 40 : // 冬季湿度低
                             50; // 春秋适中
    const humidityRange = [seasonHumidityBase - 20, seasonHumidityBase + 20];
    
    // 日内温度变化
    const hourlyTempAdjustment = dayTempFactor * 5; // ±5°C的日变化
    
    temperature = tempRange[0] + generateDeterministicRandom(tempSeed) * (tempRange[1] - tempRange[0]) + hourlyTempAdjustment;
    humidity = humidityRange[0] + generateDeterministicRandom(humiditySeed) * (humidityRange[1] - humidityRange[0]);
    waterLevel = waterRange[0] + generateDeterministicRandom(waterLevelSeed) * (waterRange[1] - waterRange[0]);
    gasCh4 = gasRange[0] + generateDeterministicRandom(gasSeed) * (gasRange[1] - gasRange[0]);
    batteryLevel = batteryRange[0] + generateDeterministicRandom(batterySeed) * (batteryRange[1] - batteryRange[0]);
    signalStrength = signalRange[0] + generateDeterministicRandom(signalSeed) * (signalRange[1] - signalRange[0]);
  }
  
  // 根据状态范围调整最终值，确保在合理范围内
  temperature = Math.min(Math.max(temperature, tempRange[0]), tempRange[1]);
  humidity = Math.min(Math.max(humidity, humidityRange[0]), humidityRange[1]);
  waterLevel = Math.min(Math.max(waterLevel, waterRange[0]), waterRange[1]);
  gasCh4 = Math.min(Math.max(gasCh4, gasRange[0]), gasRange[1]);
  batteryLevel = Math.min(Math.max(batteryLevel, batteryRange[0]), batteryRange[1]);
  signalStrength = Math.min(Math.max(signalStrength, signalRange[0]), signalRange[1]);
  
  // 四舍五入到合理精度
  temperature = parseFloat(temperature.toFixed(1));
  humidity = parseFloat(humidity.toFixed(1));
  waterLevel = parseFloat(waterLevel.toFixed(0));
  gasCh4 = parseFloat(gasCh4.toFixed(1));
  batteryLevel = parseFloat(batteryLevel.toFixed(0));
  signalStrength = parseFloat(signalStrength.toFixed(0));
  
  // 设置更精确的传感器精度
  const temperatureAccuracy = 0.5; // ±0.5℃
  const waterLevelAccuracy = 2.0; // ±2cm
  
  // 创建模拟实时数据对象
  // 传感器数据，如加速度计和倾斜角度不应该频繁变化
  // 使用确定性随机值，保证相同条件下生成相同的数据
  const accXSeed = baseSeed + 701;
  const accYSeed = baseSeed + 702;
  const accZSeed = baseSeed + 703;
  const pitchSeed = baseSeed + 704;
  const rollSeed = baseSeed + 705;
  
  const newData: ManholeRealTimeData = {
    id: `data_${manholeId}_${hourTimestamp}`,
    manholeId: manholeId,
    timestamp: now.toISOString(),
    waterLevel,
    gasConcentration: {
      ch4: gasCh4,
      co: parseFloat((gasCh4 * 0.2).toFixed(1)),
      h2s: parseFloat((gasCh4 * 0.1).toFixed(1)),
      o2: parseFloat((21 - gasCh4 * 0.01).toFixed(1))
    },
    temperature,
    humidity,
    batteryLevel,
    signalStrength,
    coverStatus,
    accelerometer: lastData?.accelerometer || {
      x: parseFloat((generateDeterministicRandom(accXSeed) * 0.1).toFixed(2)),
      y: parseFloat((generateDeterministicRandom(accYSeed) * 0.1).toFixed(2)),
      z: parseFloat((1 + generateDeterministicRandom(accZSeed) * 0.1).toFixed(2))
    },
    tilt: lastData?.tilt || {
      pitch: parseFloat((generateDeterministicRandom(pitchSeed) * 2).toFixed(1)),
      roll: parseFloat((generateDeterministicRandom(rollSeed) * 2).toFixed(1))
    },
    // 新增传感器精度指标
    accuracy: {
      temperature: temperatureAccuracy,
      waterLevel: waterLevelAccuracy
    }
  };
  
  // 保存此次生成的数据，供下次使用
  lastGeneratedData.set(manholeId, newData);
  
  return newData;
};

/**
 * 批量生成模拟井盖实时数据
 * @param manholes 井盖数据
 * @returns 井盖ID到实时数据的映射
 */
export const generateMockRealTimeDataBatch = (manholes: ManholeInfo[]): Map<string, ManholeRealTimeData> => {
  const realTimeDataMap = new Map<string, ManholeRealTimeData>();
  
  manholes.forEach(manhole => {
    realTimeDataMap.set(manhole.id, generateMockRealTimeData(manhole.id, manhole.status));
  });
  
  return realTimeDataMap;
};

/**
 * 生成模拟告警数据
 * @param manholes 井盖信息数组
 * @returns 告警信息数组
 */
export const generateMockAlarms = (manholes: ManholeInfo[]): ManholeAlarm[] => {
  const now = new Date();
  const alarms: ManholeAlarm[] = [];
  
  // 模拟历史数据 - 用于Z-score异常检测
  const historicalData: Record<string, Record<string, number[]>> = {};
  
  // 初始化历史数据
  manholes.forEach(manhole => {
    historicalData[manhole.id] = {
      temperature: Array(10).fill(0).map(() => getRandomFloat(15, 30)),
      waterLevel: Array(10).fill(0).map(() => getRandomFloat(10, 50)),
      gasCh4: Array(10).fill(0).map(() => getRandomFloat(10, 80)),
      batteryLevel: Array(10).fill(0).map(() => getRandomFloat(60, 100))
    };
  });
  
  // 生成警报
  manholes.forEach(manhole => {
    if (manhole.status === ManholeStatus.Offline || manhole.status === ManholeStatus.Maintenance) {
      return; // 跳过离线和维护状态的井盖
    }
    
    // 对于每个井盖，有一定概率生成警报
    const shouldGenerateAlarm = Math.random() < 0.3;
    if (!shouldGenerateAlarm) return;
    
    // 随机选择告警类型
    const alarmTypeValues = Object.values(AlarmType);
    const alarmType = getRandomElement(alarmTypeValues);
    
    // 生成相关数据值
    let value = 0;
    let history: number[] = [];
    
    switch (alarmType) {
      case AlarmType.Temperature:
        value = getRandomFloat(30, 45);
        history = historicalData[manhole.id].temperature;
        break;
      case AlarmType.WaterLevel:
        value = getRandomFloat(50, 300);
        history = historicalData[manhole.id].waterLevel;
        break;
      case AlarmType.GasLevel:
        value = getRandomFloat(100, 500);
        history = historicalData[manhole.id].gasCh4;
        break;
      case AlarmType.BatteryLow:
        value = getRandomFloat(5, 30);
        history = historicalData[manhole.id].batteryLevel;
        break;
      default:
        value = getRandomFloat(0, 100);
        history = [0, 0, 0, 0, 0].map(() => getRandomFloat(0, 100));
        break;
    }
    
    // 使用Z-score进行异常检测
    const anomalyResult = detectAnomaly(value, history);
    
    // 根据Z-score确定告警级别
    const alarmLevel = determineAlarmLevel(anomalyResult.zScore);
    
    // 创建告警
    const alarm: ManholeAlarm = {
      id: generateId('alarm'),
      manholeId: manhole.id,
      time: new Date(now.getTime() - getRandomInt(0, 24 * 60 * 60 * 1000)).toISOString(),
      type: alarmType,
      level: alarmLevel,
      description: getAlarmDescription(alarmType, manhole.id),
      isResolved: Math.random() < 0.4, // 40%的概率已解决
      // 新增告警推送时间和确认时间
      pushTime: new Date(now.getTime() - getRandomInt(0, 60 * 60 * 1000)).toISOString(),
      acknowledgeTime: Math.random() < 0.8 ? new Date(now.getTime() - getRandomInt(0, 30 * 60 * 1000)).toISOString() : undefined,
      // 新增异常检测信息
      anomalyScore: anomalyResult.zScore,
      normalRange: anomalyResult.normalRange,
      actualValue: value
    };
    
    // 如果已解决，添加解决信息
    if (alarm.isResolved) {
      alarm.resolvedTime = new Date(now.getTime() - getRandomInt(0, 12 * 60 * 60 * 1000)).toISOString();
      alarm.resolvedBy = getRandomElement(['张工', '李工', '王工', '赵工', '刘工']);
      alarm.resolveNote = `告警已处理: ${getAlarmDescription(alarmType, manhole.id)}`;
    }
    
    alarms.push(alarm);
  });
  
  return alarms;
};

/**
 * 获取告警的描述文本
 * @param type 告警类型
 * @param manholeId 井盖ID
 * @returns 告警描述
 */
const getAlarmDescription = (type: AlarmType, manholeId: string): string => {
  switch (type) {
    case AlarmType.WaterLevel:
      return `井盖${manholeId}水位异常，当前水位超过警戒线`;
    case AlarmType.GasLevel:
      return `井盖${manholeId}内气体浓度异常，可能存在安全隐患`;
    case AlarmType.Temperature:
      return `井盖${manholeId}温度异常，超出正常范围`;
    case AlarmType.BatteryLow:
      return `井盖${manholeId}电池电量低，需要更换`;
    case AlarmType.CoverOpen:
      return `井盖${manholeId}被打开，可能存在安全隐患`;
    case AlarmType.SignalLoss:
      return `井盖${manholeId}信号丢失，设备可能离线`;
    case AlarmType.Vibration:
      return `井盖${manholeId}检测到异常振动`;
    case AlarmType.Tilt:
      return `井盖${manholeId}倾斜角度异常`;
    case AlarmType.Custom:
      return `井盖${manholeId}触发自定义告警`;
    default:
      return `井盖${manholeId}发生未知告警`;
  }
};

/**
 * 生成模拟维护记录
 * @param manholes 井盖数据
 * @returns 维护记录数组
 */
export const generateMockMaintenanceRecords = (manholes: ManholeInfo[]): MaintenanceRecord[] => {
  const records: MaintenanceRecord[] = [];
  const now = new Date();
  const maintenanceTypes = Object.values(MaintenanceType);
  const operators = ['张师傅', '李师傅', '王师傅', '赵师傅', '刘师傅'];
  const statusValues = ['pending', 'inProgress', 'completed', 'cancelled'] as const;
  type MaintenanceStatus = typeof statusValues[number];
  
  // 为每个井盖生成0-2个维护记录
  manholes.forEach(manhole => {
    const recordCount = getRandomInt(0, 2);
    
    for (let i = 0; i < recordCount; i++) {
      const maintenanceType = getRandomElement(maintenanceTypes);
      const operator = getRandomElement(operators);
      
      // 创建维护时间：最近90天内随机时间
      const recordDate = new Date(now);
      recordDate.setDate(recordDate.getDate() - getRandomInt(0, 90));
      const recordTime = recordDate.toISOString();
      
      // 状态
      const statusOptions: MaintenanceStatus[] = ['pending', 'inProgress', 'completed', 'cancelled'];
      const status = getRandomElement(statusOptions);
      
      // 完成时间
      let completionTime: string | undefined = undefined;
      if (status === 'completed') {
        const completeDate = new Date(recordDate);
        completeDate.setHours(completeDate.getHours() + getRandomInt(1, 24));
        completionTime = completeDate.toISOString();
      }
      
      const notes = Math.random() > 0.5 ? `维护记录备注：${maintenanceType}工作` : undefined;
      
      const record: MaintenanceRecord = {
        id: generateId('MNT'),
        manholeId: manhole.id,
        time: recordTime,
        type: maintenanceType,
        description: getMaintenanceDescription(maintenanceType, manhole.id),
        operatorName: operator,
        contactPhone: `138${getRandomInt(10000000, 99999999)}`,
        completionTime,
        status,
        notes,
        images: Math.random() > 0.7 ? [
          `/images/maintenance/${getRandomInt(1, 10)}.jpg`,
          `/images/maintenance/${getRandomInt(1, 10)}.jpg`
        ] : undefined
      };
      
      records.push(record);
    }
  });
  
  return records;
};

/**
 * 获取维护记录的描述文本
 * @param type 维护类型
 * @param manholeId 井盖ID
 * @returns 维护描述
 */
const getMaintenanceDescription = (type: MaintenanceType, manholeId: string): string => {
  switch (type) {
    case MaintenanceType.Routine:
      return `井盖${manholeId}例行检查维护`;
    case MaintenanceType.Repair:
      return `井盖${manholeId}故障维修`;
    case MaintenanceType.Replacement:
      return `井盖${manholeId}设备更换`;
    case MaintenanceType.Calibration:
      return `井盖${manholeId}传感器校准`;
    case MaintenanceType.Cleaning:
      return `井盖${manholeId}清理维护`;
    case MaintenanceType.SystemUpgrade:
      return `井盖${manholeId}系统升级`;
    default:
      return `井盖${manholeId}未知维护操作`;
  }
};

/**
 * 生成包含健康评分的井盖数据
 * @param count 生成数量
 * @returns 井盖数据数组
 */
export const generateEnhancedManholes = (count: number): ManholeInfo[] => {
  const manholes = generateMockManholes(count);
  
  // 为每个井盖添加健康评分
  manholes.forEach(manhole => {
    // 生成模拟实时数据
    const realTimeData = generateMockRealTimeData(manhole.id, manhole.status);
    
    // 生成历史健康评分记录
    const historyCount = getRandomInt(5, 15);
    const now = new Date();
    const history: HealthScoreRecord[] = [];
    
    for (let i = 0; i < historyCount; i++) {
      const daysAgo = i + 1;
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      
      history.push({
        timestamp: date.toISOString(),
        score: getRandomInt(50, 100)
      });
    }
    
    // 计算健康评分
    manhole.healthScore = calculateHealthScore(realTimeData, history);
    manhole.latestData = realTimeData;
  });
  
  return manholes;
}; 