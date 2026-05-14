import { 
  ManholeInfo, 
  ManholeStatus, 
  ManholeRealTimeData,
  CoverStatus
} from '../typings';

// 合肥市中心坐标
const HEFEI_CENTER_LONGITUDE = 117.23;
const HEFEI_CENTER_LATITUDE = 31.83;

// 城区范围（经纬度范围）
const LONGITUDE_RANGE = 0.1; // 约10公里范围
const LATITUDE_RANGE = 0.08; // 约8公里范围

// 一些合肥市内的地标位置
const LANDMARKS = [
  { name: '合肥火车站', longitude: 117.276, latitude: 31.863 },
  { name: '合肥南站', longitude: 117.311, latitude: 31.781 },
  { name: '明珠广场', longitude: 117.226, latitude: 31.819 },
  { name: '政务中心', longitude: 117.227, latitude: 31.794 },
  { name: '包河区政府', longitude: 117.308, latitude: 31.793 },
  { name: '滨湖新区', longitude: 117.178, latitude: 31.760 },
  { name: '合肥科技大学', longitude: 117.199, latitude: 31.842 },
  { name: '合肥工业大学', longitude: 117.283, latitude: 31.869 }
];

// 合肥区域名称
const DISTRICTS = ['蜀山区', '庐阳区', '包河区', '瑶海区', '高新区', '经开区', '滨湖新区', '政务区'];

// 街道名称
const STREETS = ['长江路', '淮河路', '黄山路', '合裕路', '芜湖路', '望江路', '科学大道', '天鹅湖路', '繁华大道', '包河大道', '南京路', '庐州大道'];

/**
 * 生成合肥市范围内的模拟井盖数据
 * @param count 生成井盖数量
 * @returns 井盖数据数组
 */
export const generateHefeiManholes = (count: number): ManholeInfo[] => {
  const manholes: ManholeInfo[] = [];

  // 生成随机井盖ID的基础序号
  const baseId = 10000 + Math.floor(Math.random() * 90000);
  
  // 使用种子确保每次生成的结果一致
  const seededRandom = (seed: number) => {
    return ((seed * 9301 + 49297) % 233280) / 233280;
  };

  // 生成不同区域的井盖
  for (let i = 0; i < count; i++) {
    // 为每个井盖创建一个基于ID的唯一种子
    const seed = baseId + i;
    
    let longitude = 0;
    let latitude = 0;
    let address = '';
    let district = '';
    
    // 70%的井盖围绕地标分布，30%随机分布
    if (seededRandom(seed * 7) < 0.7) {
      // 选择一个地标
      const landmarkIndex = Math.floor(seededRandom(seed * 13) * LANDMARKS.length);
      const landmark = LANDMARKS[landmarkIndex];
      
      // 在地标周围随机分布
      longitude = landmark.longitude + (seededRandom(seed * 17) - 0.5) * 0.02;
      latitude = landmark.latitude + (seededRandom(seed * 19) - 0.5) * 0.02;
      
      // 确定区域
      district = DISTRICTS[Math.floor(seededRandom(seed * 23) * DISTRICTS.length)];
      
      // 生成地址
      const streetIndex = Math.floor(seededRandom(seed * 29) * STREETS.length);
      const streetNumber = Math.floor(seededRandom(seed * 31) * 500) + 1;
      address = `合肥市${district}${STREETS[streetIndex]}${streetNumber}号附近`;
    } else {
      // 在合肥市中心范围内随机分布
      longitude = HEFEI_CENTER_LONGITUDE + (seededRandom(seed * 37) - 0.5) * LONGITUDE_RANGE;
      latitude = HEFEI_CENTER_LATITUDE + (seededRandom(seed * 41) - 0.5) * LATITUDE_RANGE;
      
      // 确定区域
      district = DISTRICTS[Math.floor(seededRandom(seed * 43) * DISTRICTS.length)];
      
      // 生成地址
      const streetIndex = Math.floor(seededRandom(seed * 47) * STREETS.length);
      const streetNumber = Math.floor(seededRandom(seed * 53) * 500) + 1;
      address = `合肥市${district}${STREETS[streetIndex]}${streetNumber}号附近`;
    }
    
    // 生成安装日期（过去3年内）
    const installationDate = new Date();
    installationDate.setFullYear(installationDate.getFullYear() - Math.floor(seededRandom(seed * 59) * 3));
    installationDate.setMonth(Math.floor(seededRandom(seed * 61) * 12));
    installationDate.setDate(Math.floor(seededRandom(seed * 67) * 28) + 1);
    
    // 确定井盖状态 - 大部分正常，少部分异常
    let status = ManholeStatus.Normal;
    const statusRand = seededRandom(seed * 71);
    if (statusRand < 0.05) {
      status = ManholeStatus.Alarm; // 5%报警
    } else if (statusRand < 0.15) {
      status = ManholeStatus.Warning; // 10%警告
    } else if (statusRand < 0.2) {
      status = ManholeStatus.Maintenance; // 5%维护
    } else if (statusRand < 0.25) {
      status = ManholeStatus.Offline; // 5%离线
    }
    
    // 井盖基本数据
    const diameter = 60 + Math.floor(seededRandom(seed * 73) * 40); // 60-100cm
    const depth = 100 + Math.floor(seededRandom(seed * 79) * 100); // 100-200cm

    // 负责人和联系电话
    const managers = ['张工', '李工', '王工', '赵工', '刘工', '周工'];
    const manager = managers[Math.floor(seededRandom(seed * 83) * managers.length)];
    const phonePrefix = ['139', '138', '137', '136', '135', '158', '159', '188', '187'];
    const contactPhone = phonePrefix[Math.floor(seededRandom(seed * 89) * phonePrefix.length)] + 
                         Math.floor(10000000 + seededRandom(seed * 97) * 90000000);
    
    // 生成一个井盖信息对象
    const manhole: ManholeInfo = {
      id: `HF-${baseId + i}`,
      name: `合肥井盖-${baseId + i}`,
      status: status,
      location: {
        longitude: longitude,
        latitude: latitude,
        address: address,
        district: district,
        city: '合肥市',
        province: '安徽省'
      },
      model: seededRandom(seed * 101) < 0.5 ? '标准型-A' : '加强型-B',
      manufacturer: seededRandom(seed * 103) < 0.5 ? '合肥市政设施有限公司' : '安徽省市政工程有限公司',
      installationDate: installationDate.toISOString().split('T')[0],
      material: seededRandom(seed * 107) < 0.7 ? '球墨铸铁' : '复合材料',
      diameter: diameter,
      depth: depth,
      manager: manager,
      contactPhone: contactPhone,
      deviceId: `DEV-${baseId + i}`,
      sensorTypes: ['水位', '气体', '温度', '湿度', '倾斜', '振动'].filter(() => seededRandom(seed * 109) < 0.7)
    };
    
    // 添加最新数据
    const latestData: ManholeRealTimeData = {
      id: `DATA-${baseId + i}`,
      manholeId: manhole.id,
      timestamp: new Date().toISOString(),
      waterLevel: Math.floor(seededRandom(seed * 113) * 80), // 0-80%
      gasConcentration: {
        ch4: Math.floor(seededRandom(seed * 127) * 30), // 0-30ppm
        co: Math.floor(seededRandom(seed * 131) * 20), // 0-20ppm
        h2s: Math.floor(seededRandom(seed * 137) * 10), // 0-10ppm
        o2: 20 + (seededRandom(seed * 139) - 0.5) * 2 // 19-21%
      },
      temperature: 15 + seededRandom(seed * 149) * 15, // 15-30°C
      humidity: 30 + seededRandom(seed * 151) * 50, // 30-80%
      batteryLevel: 50 + Math.floor(seededRandom(seed * 157) * 50), // 50-100%
      signalStrength: 70 + Math.floor(seededRandom(seed * 163) * 30), // 70-100%
      coverStatus: seededRandom(seed * 167) < 0.1 ? CoverStatus.Open : CoverStatus.Closed, // 10%打开
      accelerometer: {
        x: (seededRandom(seed * 173) - 0.5) * 2,
        y: (seededRandom(seed * 179) - 0.5) * 2,
        z: (seededRandom(seed * 181) - 0.5) * 2
      },
      tilt: {
        pitch: (seededRandom(seed * 191) - 0.5) * 5,
        roll: (seededRandom(seed * 193) - 0.5) * 5
      },
      accuracy: {
        temperature: 0.5 + seededRandom(seed * 197) * 0.5, // 0.5-1.0
        waterLevel: 1.0 + seededRandom(seed * 199) * 1.0 // 1.0-2.0
      }
    };
    
    // 将最新数据添加到井盖信息中
    manhole.latestData = latestData;
    
    manholes.push(manhole);
  }
  
  return manholes;
};

// 默认导出150个井盖数据
export const hefeiManholes = generateHefeiManholes(150); 