const { Router } = require('express');
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { resolved, level, type, limit: qLimit } = req.query;
  let sql = 'SELECT a.*, m.name AS manhole_name FROM alarms a LEFT JOIN manholes m ON a.manhole_id = m.id WHERE 1=1';
  const params = [];
  if (resolved === 'true') { sql += ' AND a.is_resolved = 1'; }
  else if (resolved === 'false') { sql += ' AND a.is_resolved = 0'; }
  if (level) { sql += ' AND a.level = ?'; params.push(level); }
  if (type) { sql += ' AND a.type = ?'; params.push(type); }
  sql += ' ORDER BY a.created_at DESC';
  const limit = Math.min(parseInt(qLimit) || 500, 1000);
  sql += ' LIMIT ?';
  params.push(limit);
  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows, total: rows.length });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT a.*, m.name AS manhole_name FROM alarms a LEFT JOIN manholes m ON a.manhole_id = m.id WHERE a.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ data: row });
});

router.put('/:id/resolve', (req, res) => {
  const db = getDb();
  db.prepare("UPDATE alarms SET is_resolved = 1, resolved_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.put('/:id/acknowledge', (req, res) => {
  const db = getDb();
  db.prepare("UPDATE alarms SET confirmed_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
