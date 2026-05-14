const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'manhole.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS manholes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      device_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal',
      latitude REAL,
      longitude REAL,
      address TEXT,
      district TEXT,
      model TEXT,
      manufacturer TEXT,
      material TEXT,
      installation_date TEXT,
      last_maintenance_time TEXT,
      next_maintenance_time TEXT,
      diameter REAL,
      depth REAL,
      manager TEXT,
      contact_phone TEXT,
      sensor_types TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS real_time_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manhole_id TEXT NOT NULL,
      water_level REAL DEFAULT 0,
      ch4 REAL DEFAULT 0,
      co REAL DEFAULT 0,
      h2s REAL DEFAULT 0,
      o2 REAL DEFAULT 0,
      temperature REAL DEFAULT 0,
      humidity REAL DEFAULT 0,
      battery_level REAL DEFAULT 100,
      signal_strength REAL DEFAULT 0,
      cover_status TEXT DEFAULT 'closed',
      tilt_x REAL DEFAULT 0,
      tilt_y REAL DEFAULT 0,
      tilt_z REAL DEFAULT 0,
      accelerometer_x REAL DEFAULT 0,
      accelerometer_y REAL DEFAULT 0,
      accelerometer_z REAL DEFAULT 0,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (manhole_id) REFERENCES manholes(id)
    );

    CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY,
      manhole_id TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT,
      is_resolved INTEGER DEFAULT 0,
      confirmed_at TEXT,
      resolved_at TEXT,
      anomaly_score REAL,
      actual_value REAL,
      normal_range_min REAL,
      normal_range_max REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (manhole_id) REFERENCES manholes(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY,
      manhole_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      operator_name TEXT,
      operator_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      images TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (manhole_id) REFERENCES manholes(id)
    );

    CREATE TABLE IF NOT EXISTS health_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manhole_id TEXT NOT NULL,
      sensor_score REAL DEFAULT 100,
      battery_score REAL DEFAULT 100,
      communication_score REAL DEFAULT 100,
      total_score REAL DEFAULT 100,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (manhole_id) REFERENCES manholes(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'operator',
      status TEXT DEFAULT 'active',
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_realtime_manhole ON real_time_data(manhole_id, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alarms_manhole ON alarms(manhole_id);
    CREATE INDEX IF NOT EXISTS idx_alarms_resolved ON alarms(is_resolved);
    CREATE INDEX IF NOT EXISTS idx_maintenance_manhole ON maintenance_records(manhole_id);
    CREATE INDEX IF NOT EXISTS idx_health_manhole ON health_scores(manhole_id, recorded_at DESC);
  `);

  // 迁移：为 users 表添加 updated_at 列（如果不存在）
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
    if (!hasUpdatedAt) {
      db.exec("ALTER TABLE users ADD COLUMN updated_at TEXT");
      db.exec("UPDATE users SET updated_at = datetime('now') WHERE updated_at IS NULL");
      console.log('[db] 迁移：已为 users 表添加 updated_at 列');
    }
  } catch (err) {
    console.error('[db] 迁移检查失败:', err.message);
  }
}

module.exports = { getDb };
