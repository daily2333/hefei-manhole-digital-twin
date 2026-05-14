const { Router } = require('express');
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM manholes ORDER BY created_at DESC').all();
  const list = rows.map(r => ({
    ...r,
    sensor_types: safeJson(r.sensor_types, []),
  }));
  res.json({ data: list, total: list.length });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM manholes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  row.sensor_types = safeJson(row.sensor_types, []);
  row.latestData = db.prepare('SELECT * FROM real_time_data WHERE manhole_id = ? ORDER BY recorded_at DESC LIMIT 1').get(row.id) || null;
  row.healthScore = db.prepare('SELECT * FROM health_scores WHERE manhole_id = ? ORDER BY recorded_at DESC LIMIT 1').get(row.id) || null;
  res.json({ data: row });
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { name, device_id, latitude, longitude, address, district, model, manufacturer, material, diameter, depth, manager, contact_phone, sensor_types } = req.body;
  db.prepare(`INSERT INTO manholes (id, name, device_id, latitude, longitude, address, district, model, manufacturer, material, diameter, depth, manager, contact_phone, sensor_types) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, name, device_id, latitude, longitude, address, district, model, manufacturer, material, diameter, depth, manager, contact_phone, JSON.stringify(sensor_types || [])
  );
  const created = db.prepare('SELECT * FROM manholes WHERE id = ?').get(id);
  res.status(201).json({ data: created });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM manholes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const fields = ['name', 'status', 'device_id', 'latitude', 'longitude', 'address', 'district', 'model', 'manufacturer', 'material', 'diameter', 'depth', 'manager', 'contact_phone', 'last_maintenance_time', 'next_maintenance_time'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (req.body.sensor_types !== undefined) {
    updates.push('sensor_types = ?');
    values.push(JSON.stringify(req.body.sensor_types));
  }
  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);
    db.prepare(`UPDATE manholes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  const updated = db.prepare('SELECT * FROM manholes WHERE id = ?').get(req.params.id);
  res.json({ data: updated });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM manholes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

function safeJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
