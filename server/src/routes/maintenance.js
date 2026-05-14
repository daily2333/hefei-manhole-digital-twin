const { Router } = require('express');
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, limit: qLimit } = req.query;
  let sql = 'SELECT r.*, m.name AS manhole_name FROM maintenance_records r LEFT JOIN manholes m ON r.manhole_id = m.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC';
  const limit = Math.min(parseInt(qLimit) || 500, 1000);
  sql += ' LIMIT ?';
  params.push(limit);
  const rows = db.prepare(sql).all(...params).map(r => ({ ...r, images: safeJson(r.images, []) }));
  res.json({ data: rows, total: rows.length });
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { manhole_id, type, description, operator_name, operator_phone, status } = req.body;
  db.prepare('INSERT INTO maintenance_records (id, manhole_id, type, description, operator_name, operator_phone, status) VALUES (?,?,?,?,?,?,?)').run(id, manhole_id, type, description, operator_name, operator_phone, status || 'pending');
  const created = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  res.status(201).json({ data: created });
});

router.put('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  const completedAt = status === 'completed' ? ", completed_at = datetime('now')" : '';
  db.prepare(`UPDATE maintenance_records SET status = ?${completedAt} WHERE id = ?`).run(status, req.params.id);
  res.json({ success: true });
});

function safeJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
