const { Router } = require('express');
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

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

router.post('/', authMiddleware, (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { manhole_id, type, description, operator_name, operator_phone, status } = req.body;
  if (!manhole_id || !type) {
    return res.status(400).json({ error: 'manhole_id 和 type 不能为空' });
  }
  const finalStatus = VALID_STATUSES.includes(status) ? status : 'pending';
  db.prepare('INSERT INTO maintenance_records (id, manhole_id, type, description, operator_name, operator_phone, status) VALUES (?,?,?,?,?,?,?)').run(id, manhole_id, type, description, operator_name, operator_phone, finalStatus);
  const created = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  res.status(201).json({ data: created });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `无效状态，可选值: ${VALID_STATUSES.join(', ')}` });
  }
  const existing = db.prepare('SELECT id FROM maintenance_records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  const completedAt = status === 'completed' ? ", completed_at = datetime('now')" : '';
  db.prepare(`UPDATE maintenance_records SET status = ?${completedAt} WHERE id = ?`).run(status, req.params.id);
  res.json({ success: true });
});

function safeJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
