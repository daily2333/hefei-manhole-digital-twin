const mqtt = require('mqtt');
const { getDb } = require('../db');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'manhole/+/data';

let client = null;

function setupMqttClient(io) {
  // For now, log that MQTT is disabled until a broker is available
  console.log(`[mqtt] disabled — set MQTT_BROKER env to enable (e.g. ${MQTT_BROKER})`);

  if (!process.env.MQTT_BROKER) return;

  client = mqtt.connect(MQTT_BROKER);

  client.on('connect', () => {
    console.log(`[mqtt] connected to ${MQTT_BROKER}`);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) console.error('[mqtt] subscribe error:', err);
      else console.log(`[mqtt] subscribed to ${MQTT_TOPIC}`);
    });
  });

  client.on('message', (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      const deviceId = topic.split('/')[1];
      handleIncomingData(deviceId, msg, io);
    } catch (err) {
      console.error('[mqtt] parse error:', err.message);
    }
  });

  client.on('error', (err) => {
    console.error('[mqtt] connection error:', err.message);
  });
}

function handleIncomingData(deviceId, msg, io) {
  const db = getDb();
  const manhole = db.prepare('SELECT id FROM manholes WHERE device_id = ?').get(deviceId);

  if (!manhole) {
    console.warn(`[mqtt] unknown device: ${deviceId}`);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO real_time_data
      (manhole_id, water_level, ch4, co, h2s, o2, temperature, humidity,
       battery_level, signal_strength, cover_status, tilt_x, tilt_y, tilt_z, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const info = stmt.run(
    manhole.id,
    msg.water_level ?? 0,
    msg.ch4 ?? 0,
    msg.co ?? 0,
    msg.h2s ?? 0,
    msg.o2 ?? 0,
    msg.temperature ?? 0,
    msg.humidity ?? 0,
    msg.battery_level ?? 100,
    msg.signal_strength ?? 0,
    msg.cover_status ?? 'closed',
    msg.tilt_x ?? 0,
    msg.tilt_y ?? 0,
    msg.tilt_z ?? 0,
  );

  const inserted = db.prepare('SELECT * FROM real_time_data WHERE id = ?').get(info.lastInsertRowid);

  if (io) {
    io.to(`manhole:${manhole.id}`).emit('realtime:update', inserted);
    io.emit('realtime:global', { manholeId: manhole.id, data: inserted });
  }

  checkAnomalies(manhole.id, msg, db, io);
}

function checkAnomalies(manholeId, msg, db, io) {
  const checks = [
    { field: 'temperature', value: msg.temperature, min: -10, max: 60 },
    { field: 'water_level', value: msg.water_level, min: 0, max: 200 },
    { field: 'battery_level', value: msg.battery_level, min: 0, max: 100 },
    { field: 'ch4', value: msg.ch4, min: 0, max: 500 },
  ];

  for (const check of checks) {
    if (check.value == null) continue;
    if (check.value < check.min || check.value > check.max) {
      const alarmId = require('uuid').v4();
      const level = check.value > check.max * 1.5 ? 'critical' : 'warning';
      const message = `${check.field} out of range: ${check.value} (normal: ${check.min}~${check.max})`;

      db.prepare(`INSERT INTO alarms (id, manhole_id, type, level, message, actual_value, normal_range_min, normal_range_max) VALUES (?,?,?,?,?,?,?,?)`).run(
        alarmId, manholeId, check.field, level, message, check.value, check.min, check.max
      );

      if (io) io.emit('alarm:new', { id: alarmId, manholeId, type: check.field, level, message });
    }
  }
}

module.exports = { setupMqttClient };
