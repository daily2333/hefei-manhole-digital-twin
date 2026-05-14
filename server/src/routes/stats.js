const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/overview', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) AS c FROM manholes').get().c;
  const statusDist = db.prepare('SELECT status, COUNT(*) AS c FROM manholes GROUP BY status').all();
  const unresolvedAlarms = db.prepare('SELECT COUNT(*) AS c FROM alarms WHERE is_resolved = 0').get().c;
  const pendingMaintenance = db.prepare("SELECT COUNT(*) AS c FROM maintenance_records WHERE status = 'pending'").get().c;
  const avgHealth = db.prepare('SELECT AVG(total_score) AS avg FROM health_scores').get().avg || 0;

  res.json({
    data: {
      totalManholes: total,
      statusDistribution: Object.fromEntries(statusDist.map(s => [s.status, s.c])),
      unresolvedAlarms,
      pendingMaintenance,
      averageHealthScore: Math.round(avgHealth * 100) / 100,
    }
  });
});

router.get('/realtime-summary', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      AVG(r.temperature) AS avg_temp,
      AVG(r.humidity) AS avg_humidity,
      AVG(r.water_level) AS avg_water,
      AVG(r.battery_level) AS avg_battery,
      AVG(r.signal_strength) AS avg_signal
    FROM real_time_data r
    INNER JOIN (SELECT manhole_id, MAX(recorded_at) AS max_t FROM real_time_data GROUP BY manhole_id) latest
    ON r.manhole_id = latest.manhole_id AND r.recorded_at = latest.max_t
  `).get();
  res.json({ data: rows });
});

router.get('/alarm-trend', (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 7;
  const rows = db.prepare(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM alarms
    WHERE created_at >= datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(`-${days} days`);
  res.json({ data: rows });
});

module.exports = router;
