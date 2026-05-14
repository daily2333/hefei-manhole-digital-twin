const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT r.* FROM real_time_data r
    INNER JOIN (SELECT manhole_id, MAX(recorded_at) AS max_t FROM real_time_data GROUP BY manhole_id) latest
    ON r.manhole_id = latest.manhole_id AND r.recorded_at = latest.max_t
  `).all();
  res.json({ data: rows });
});

router.get('/:manholeId', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM real_time_data WHERE manhole_id = ? ORDER BY recorded_at DESC LIMIT 1').get(req.params.manholeId);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ data: row });
});

router.get('/:manholeId/history', (req, res) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
  const rows = db.prepare('SELECT * FROM real_time_data WHERE manhole_id = ? ORDER BY recorded_at DESC LIMIT ?').all(req.params.manholeId, limit);
  res.json({ data: rows });
});

module.exports = router;
