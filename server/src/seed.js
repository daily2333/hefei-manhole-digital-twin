const { getDb } = require('./db');
const { v4: uuidv4 } = require('uuid');

const db = getDb();

console.log('[seed] clearing existing data...');
for (const t of ['real_time_data', 'alarms', 'maintenance_records', 'health_scores', 'manholes', 'users']) {
  db.prepare(`DELETE FROM ${t}`).run();
}

// ----- REALISTIC DATA GENERATORS -----
const DISTRICTS = ['蜀山区', '庐阳区', '包河区', '瑶海区', '新站区', '经开区', '高新区', '滨湖区'];
const ROADS = ['长江路', '黄山路', '合作化路', '徽州大道', '望江路', '科学大道', '繁华大道', '习友路', '南宁路', '金寨路', '宿松路', '方兴大道', '锦绣大道', '紫云路', '云谷路'];
const MODELS = ['MH-2000', 'MH-3000 Pro', 'MH-1000', 'MH-5000S', 'MH-Elite'];
const MANUFACTURERS = ['智慧城市科技', '中科传感', '润华智能', '华威电子', '蓝鲸物联'];
const MATERIALS = ['球墨铸铁', '铸铁', '复合材料'];
const MANAGERS = ['张维', '李明', '王芳', '赵岩', '刘洋', '陈丽'];
const PHONES = ['138****1234', '139****5678', '137****9012', '136****3456', '135****7890', '152****2345'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randf(min, max, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// 合肥市中心：117.27, 31.86
function generateHefeiLocation() {
  const districts = {
    '蜀山区': { lat: [31.82, 31.88], lng: [117.20, 117.28] },
    '庐阳区': { lat: [31.87, 31.92], lng: [117.24, 117.32] },
    '包河区': { lat: [31.78, 31.85], lng: [117.26, 117.34] },
    '瑶海区': { lat: [31.85, 31.91], lng: [117.30, 117.38] },
    '新站区': { lat: [31.90, 31.96], lng: [117.28, 117.36] },
    '经开区': { lat: [31.76, 31.82], lng: [117.18, 117.26] },
    '高新区': { lat: [31.80, 31.86], lng: [117.14, 117.22] },
    '滨湖区': { lat: [31.70, 31.78], lng: [117.28, 117.36] },
  };
  const district = pick(Object.keys(districts));
  const bounds = districts[district];
  return {
    district,
    latitude: randf(bounds.lat[0], bounds.lat[1], 6),
    longitude: randf(bounds.lng[0], bounds.lng[1], 6),
    address: `${district}${pick(ROADS)}${rand(1, 2000)}号`,
  };
}

function generateSensorTypes() {
  const options = [
    ['temperature', 'humidity'],
    ['temperature', 'humidity', 'water'],
    ['temperature', 'humidity', 'water', 'gas'],
    ['temperature', 'humidity', 'water', 'gas', 'tilt'],
    ['temperature', 'humidity', 'gas'],
  ];
  return pick(options);
}

function generateStatusByAge(monthsSinceInstall) {
  if (monthsSinceInstall > 48) return pick(['warning', 'alarm', 'offline', 'normal', 'normal']);
  if (monthsSinceInstall > 24) return pick(['warning', 'normal', 'normal', 'normal', 'alarm']);
  return pick(['normal', 'normal', 'normal', 'normal', 'warning']);
}

// ----- SEED MANHOLES (50 devices for realism) -----
console.log('[seed] inserting 50 manholes...');
const manholeIds = [];
const insertManhole = db.prepare(`
  INSERT INTO manholes (id, name, device_id, status, latitude, longitude, address, district, model, manufacturer, material, installation_date, last_maintenance_time, next_maintenance_time, diameter, depth, manager, contact_phone, sensor_types)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const manholeData = [];
const insertManholeTrx = db.transaction(() => {
  for (let i = 0; i < 50; i++) {
    const id = uuidv4();
    manholeIds.push(id);
    const loc = generateHefeiLocation();
    const sensorTypes = generateSensorTypes();
    const monthsAgo = rand(1, 72);
    const installDate = new Date(Date.now() - monthsAgo * 30 * 86400000);
    const lastMaint = new Date(Date.now() - rand(10, 180) * 86400000);
    const nextMaint = new Date(lastMaint.getTime() + rand(90, 270) * 86400000);
    const status = generateStatusByAge(monthsAgo);

    manholeData.push({ id, status, sensorTypes, monthsAgo });

    insertManhole.run(
      id,
      `${loc.district}${loc.address.split(loc.district)[1] || loc.address}井`,
      `MH-${String(i + 1).padStart(4, '0')}`,
      status,
      loc.latitude, loc.longitude,
      loc.address, loc.district,
      pick(MODELS), pick(MANUFACTURERS), pick(MATERIALS),
      installDate.toISOString(),
      lastMaint.toISOString(),
      nextMaint.toISOString(),
      randf(0.6, 1.0), randf(0.5, 2.0),
      pick(MANAGERS), pick(PHONES),
      JSON.stringify(sensorTypes)
    );
  }
});
insertManholeTrx();
console.log(`[seed] ${manholeIds.length} manholes inserted`);

// ----- REALISTIC REALTIME DATA (72 hours) -----
console.log('[seed] inserting 72h of realtime data...');
const insertRT = db.prepare(`
  INSERT INTO real_time_data (manhole_id, water_level, ch4, co, h2s, o2, temperature, humidity, battery_level, signal_strength, cover_status, tilt_x, tilt_y, tilt_z, recorded_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRTTrx = db.transaction(() => {
  for (const mid of manholeIds) {
    // Base parameters vary per manhole
    const baseTemp = randf(18, 32);
    const baseHum = randf(45, 80);
    const baseWater = randf(2, 25);
    const hasHighWater = Math.random() < 0.15;
    const hasGasLeak = Math.random() < 0.08;
    const isRaining = Math.random() < 0.3;

    for (let h = 0; h < 72; h++) {
      const absHour = h % 24;
      const dayFactor = Math.sin((absHour - 5) * Math.PI / 12);
      const rainEffect = isRaining ? randf(1, 8) : 0;

      // Temperature: follows daily cycle
      const temp = clamp(baseTemp + dayFactor * 7 + randf(-1.5, 1.5), -2, 55);

      // Humidity: inversely related to temperature
      const hum = clamp(baseHum - dayFactor * 15 + randf(-4, 4), 10, 100);

      // Water level: higher when raining, spikes randomly
      const waterSpike = hasHighWater && Math.random() < 0.05 ? randf(20, 80) : 0;
      const water = clamp(baseWater + rainEffect + randf(-2, 2) + waterSpike, 0, 200);

      // Gas: occasional leak simulation
      const gasLeak = hasGasLeak && Math.random() < 0.01 ? randf(20, 80) : 0;
      const ch4 = clamp(randf(0, 5) + gasLeak, 0, 500);
      const co = clamp(randf(0, 2) + gasLeak * 0.3, 0, 100);
      const h2s = clamp(randf(0, 0.5) + gasLeak * 0.1, 0, 50);
      const o2 = clamp(20.9 - gasLeak * 0.02 + randf(-0.2, 0.2), 15, 25);

      // Battery: slowly drains over 72h
      const batteryDrain = h * 0.08;
      const battery = clamp(randf(60, 100) - batteryDrain + randf(-2, 2), 0, 100);

      // Signal
      const signal = clamp(randf(-75, -45) + randf(-5, 5), -120, -30);

      const coverStatus = Math.random() < 0.95 ? 'closed' : (Math.random() < 0.5 ? 'open' : 'half_open');
      const tilt = coverStatus !== 'closed' ? randf(1, 15) : randf(-2, 2);

      insertRT.run(
        mid, water, ch4, co, h2s, o2, temp, hum, battery, signal, coverStatus,
        randf(-2, 2), randf(-2, 2), tilt,
        new Date(Date.now() - (71 - h) * 3600000).toISOString()
      );
    }
  }
});
insertRTTrx();

// ----- REALISTIC ALARMS -----
console.log('[seed] inserting alarms...');
const insertAlarm = db.prepare(`
  INSERT INTO alarms (id, manhole_id, type, level, message, is_resolved, actual_value, normal_range_min, normal_range_max, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const alarmTrx = db.transaction(() => {
  for (const mid of manholeIds) {
    const alarmCount = rand(0, 4);
    for (let j = 0; j < alarmCount; j++) {
      const types = ['water_level', 'temperature', 'battery_low', 'gas_leak', 'tilt', 'cover_open'];
      const type = pick(types);
      const isResolved = Math.random() < 0.6 ? 1 : 0;
      let level, value, min, max, msg;
      switch (type) {
        case 'water_level':
          value = randf(30, 180); min = 0; max = 30;
          level = value > 100 ? 'critical' : 'warning';
          msg = `水位异常: ${value.toFixed(1)}mm`;
          break;
        case 'temperature':
          value = randf(40, 65); min = -10; max = 50;
          level = value > 55 ? 'critical' : 'warning';
          msg = `温度异常: ${value.toFixed(1)}°C`;
          break;
        case 'battery_low':
          value = randf(5, 25); min = 20; max = 100;
          level = value < 10 ? 'critical' : 'warning';
          msg = `电池电量不足: ${value.toFixed(1)}%`;
          break;
        case 'gas_leak':
          value = randf(30, 200); min = 0; max = 20;
          level = value > 100 ? 'critical' : 'warning';
          msg = `气体泄漏: ${value.toFixed(1)}ppm`;
          break;
        case 'tilt':
          value = randf(10, 45); min = 0; max = 10;
          level = value > 30 ? 'critical' : 'warning';
          msg = `井盖倾斜: ${value.toFixed(1)}°`;
          break;
        case 'cover_open':
          value = 1; min = 0; max = 0;
          level = 'critical';
          msg = '井盖异常开启';
          break;
      }
      insertAlarm.run(
        uuidv4(), mid, type, level, msg, isResolved,
        value, min, max,
        new Date(Date.now() - rand(0, 14) * 86400000).toISOString()
      );
    }
  }
});
alarmTrx();

// ----- MAINTENANCE RECORDS -----
console.log('[seed] inserting maintenance records...');
const insertMaint = db.prepare(`
  INSERT INTO maintenance_records (id, manhole_id, type, description, operator_name, operator_phone, status, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const TASKS = [
  '更换井盖密封圈', '清理排水孔堵塞物', '校准传感器数据', '更换电池组',
  '检查通信模块', '清洁太阳能板', '紧固螺栓连接件', '升级固件版本',
  '修复倾斜传感器', '清理井内淤泥', '更换水位传感器', '检查电路板受潮',
];

const maintTrx = db.transaction(() => {
  for (const mid of manholeIds) {
    const count = rand(0, 4);
    for (let j = 0; j < count; j++) {
      const status = pick(['completed', 'completed', 'completed', 'completed', 'pending', 'in_progress']);
      const daysAgo = rand(1, 120);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const completedAt = status === 'completed' ? new Date(Date.now() - rand(0, daysAgo) * 86400000).toISOString() : null;
      insertMaint.run(
        uuidv4(), mid, pick(['inspection', 'repair', 'replacement', 'cleaning', 'upgrade']),
        pick(TASKS),
        pick(MANAGERS), pick(PHONES), status, createdAt, completedAt
      );
    }
  }
});
maintTrx();

// ----- HEALTH SCORES (90 days) -----
console.log('[seed] inserting 90 days of health scores...');
const insertHS = db.prepare(`
  INSERT INTO health_scores (manhole_id, sensor_score, battery_score, communication_score, total_score, recorded_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const hsTrx = db.transaction(() => {
  for (const mid of manholeIds) {
    // Gradual decline simulation
    const initialTotal = randf(82, 98);
    for (let d = 0; d < 90; d++) {
      const decline = d * 0.08;
      const noise = randf(-3, 3);
      const sensor = clamp(initialTotal - decline + noise + randf(-2, 2), 50, 100);
      const battery = clamp(initialTotal - decline * 1.2 + noise + randf(-3, 3), 30, 100);
      const comm = clamp(initialTotal - decline * 0.7 + noise + randf(-1, 1), 55, 100);
      const total = clamp(sensor * 0.4 + battery * 0.3 + comm * 0.3, 0, 100);
      insertHS.run(
        mid,
        Math.round(sensor * 100) / 100,
        Math.round(battery * 100) / 100,
        Math.round(comm * 100) / 100,
        Math.round(total * 100) / 100,
        new Date(Date.now() - (89 - d) * 86400000).toISOString()
      );
    }
  }
});
hsTrx();

// ----- USERS -----
console.log('[seed] inserting users...');
db.prepare(`INSERT INTO users (id, username, password, display_name, role, status, email, phone) VALUES (?,?,?,?,?,?,?,?)`).run(
  uuidv4(), 'admin', 'admin123', '系统管理员', 'admin', 'active', 'admin@manhole.cn', '13800000000'
);
db.prepare(`INSERT INTO users (id, username, password, display_name, role, status, email, phone) VALUES (?,?,?,?,?,?,?,?)`).run(
  uuidv4(), 'operator', '123456', '运维操作员', 'operator', 'active', 'op@manhole.cn', '13800000001'
);
db.prepare(`INSERT INTO users (id, username, password, display_name, role, status, email, phone) VALUES (?,?,?,?,?,?,?,?)`).run(
  uuidv4(), 'viewer', '123456', '观察员', 'viewer', 'active', 'viewer@manhole.cn', '13800000002'
);

console.log('[seed] done!');
console.log(`  - 50 manholes`);
console.log(`  - 50 × 72h = ${50 * 72} realtime data points`);
console.log(`  - 3 users (admin/operator/viewer)`);
