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

router.get('/environment-summary', (req, res) => {
  const db = getDb();
  const period = req.query.period || '24h';
  const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24;

  const temperatureRows = db.prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00', recorded_at) AS time,
           AVG(temperature) AS value,
           MAX(temperature) AS max,
           MIN(temperature) AS min
    FROM real_time_data
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY strftime('%Y-%m-%dT%H:00:00', recorded_at)
    ORDER BY time
  `).all(`-${hours} hours`);

  const humidityRows = db.prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00', recorded_at) AS time,
           AVG(humidity) AS value,
           MAX(humidity) AS max,
           MIN(humidity) AS min
    FROM real_time_data
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY strftime('%Y-%m-%dT%H:00:00', recorded_at)
    ORDER BY time
  `).all(`-${hours} hours`);

  const gasRows = db.prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00', recorded_at) AS time,
           AVG(ch4) AS ch4, AVG(co) AS co, AVG(h2s) AS h2s, AVG(o2) AS o2
    FROM real_time_data
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY strftime('%Y-%m-%dT%H:00:00', recorded_at)
    ORDER BY time
  `).all(`-${hours} hours`);

  const districtData = db.prepare(`
    SELECT m.district,
           AVG(rt.temperature) AS avgTemp,
           AVG(rt.humidity) AS avgHumidity,
           AVG(rt.water_level) AS avgWater,
           COUNT(DISTINCT m.id) AS manholeCount
    FROM manholes m
    LEFT JOIN real_time_data rt ON rt.manhole_id = m.id
      AND rt.recorded_at IN (SELECT MAX(recorded_at) FROM real_time_data WHERE manhole_id = m.id)
    WHERE m.district IS NOT NULL
    GROUP BY m.district
  `).all();

  res.json({
    data: {
      temperatureData: temperatureRows.map(r => ({ ...r, value: Math.round(r.value * 100) / 100, max: Math.round(r.max * 100) / 100, min: Math.round(r.min * 100) / 100 })),
      humidityData: humidityRows.map(r => ({ ...r, value: Math.round(r.value * 100) / 100, max: Math.round(r.max * 100) / 100, min: Math.round(r.min * 100) / 100 })),
      gasData: gasRows.map(r => ({ ...r, ch4: Math.round(r.ch4 * 100) / 100, co: Math.round(r.co * 100) / 100, h2s: Math.round(r.h2s * 100) / 100, o2: Math.round(r.o2 * 100) / 100 })),
      districtData,
    }
  });
});

router.get('/gas-distribution', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT AVG(r.ch4) AS ch4, AVG(r.co) AS co, AVG(r.h2s) AS h2s, AVG(r.o2) AS o2
    FROM real_time_data r
    INNER JOIN (SELECT manhole_id, MAX(recorded_at) AS max_t FROM real_time_data GROUP BY manhole_id) latest
    ON r.manhole_id = latest.manhole_id AND r.recorded_at = latest.max_t
  `).get();
  res.json({ data: { ch4: Math.round(row.ch4 * 100) / 100, co: Math.round(row.co * 100) / 100, h2s: Math.round(row.h2s * 100) / 100, o2: Math.round(row.o2 * 100) / 100 } });
});

router.get('/cover-status', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT r.cover_status, COUNT(*) AS c
    FROM real_time_data r
    INNER JOIN (SELECT manhole_id, MAX(recorded_at) AS max_t FROM real_time_data GROUP BY manhole_id) latest
    ON r.manhole_id = latest.manhole_id AND r.recorded_at = latest.max_t
    GROUP BY r.cover_status
  `).all();
  const result = { closed: 0, open: 0, half_open: 0 };
  for (const r of rows) result[r.cover_status] = r.c;
  res.json({ data: result });
});

router.get('/analytics', (req, res) => {
  const db = getDb();
  const dataType = req.query.dataType || 'all';
  const days = parseInt(req.query.days) || 30;

  const trendSql = `
    SELECT DATE(recorded_at) AS date,
           AVG(temperature) AS temperature,
           AVG(humidity) AS humidity,
           AVG(water_level) AS waterLevel,
           AVG(ch4) AS gasConcentration,
           AVG(battery_level) AS batteryLevel
    FROM real_time_data
    WHERE recorded_at >= datetime('now', ?)
    GROUP BY DATE(recorded_at)
    ORDER BY date
  `;
  const trendData = db.prepare(trendSql).all(`-${days} days`);

  const distributionData = db.prepare(`
    SELECT m.district AS area,
           AVG(rt.temperature) AS temperature,
           AVG(rt.humidity) AS humidity,
           AVG(rt.water_level) AS waterLevel,
           AVG(rt.ch4) AS gasConcentration
    FROM manholes m
    LEFT JOIN real_time_data rt ON rt.manhole_id = m.id
      AND rt.recorded_at IN (SELECT MAX(recorded_at) FROM real_time_data WHERE manhole_id = m.id)
    WHERE m.district IS NOT NULL
    GROUP BY m.district
  `).all();

  const pearsonPairs = [
    ['temperature', 'humidity'],
    ['temperature', 'water_level'],
    ['humidity', 'ch4'],
    ['water_level', 'ch4'],
    ['battery_level', 'temperature'],
  ];
  const correlationData = pearsonPairs.map(([m1, m2]) => {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS n,
        SUM(${m1}) AS sumX, SUM(${m2}) AS sumY,
        SUM(${m1} * ${m2}) AS sumXY,
        SUM(${m1} * ${m1}) AS sumX2,
        SUM(${m2} * ${m2}) AS sumY2
      FROM real_time_data
      WHERE recorded_at >= datetime('now', '-${days} days')
        AND ${m1} IS NOT NULL AND ${m2} IS NOT NULL
    `).get();
    const { n, sumX, sumY, sumXY, sumX2, sumY2 } = row;
    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const coefficient = denom === 0 ? 0 : parseFloat(((n * sumXY - sumX * sumY) / denom).toFixed(2));
    return { metric1: m1 === 'water_level' ? 'waterLevel' : m1 === 'ch4' ? 'gasConcentration' : m1, metric2: m2 === 'water_level' ? 'waterLevel' : m2 === 'ch4' ? 'gasConcentration' : m2, coefficient };
  });

  const rawAnomalies = db.prepare(`
    SELECT recorded_at AS date, water_level AS value, 'water_level' AS metric
    FROM real_time_data
    WHERE water_level > 30 AND recorded_at >= datetime('now', ?)
    ORDER BY recorded_at DESC LIMIT 50
  `).all(`-${days} days`);

  const anomalyData = rawAnomalies.map(a => ({
    date: a.date,
    value: Math.round(a.value * 100) / 100,
    anomalyScore: Math.round((Math.min(a.value / 50, 1) * 100)) / 100,
    isAnomaly: a.value > 50,
    metric: a.metric,
  }));

  const areas = ['蜀山区', '庐阳区', '包河区', '瑶海区', '新站区', '经开区', '高新区', '滨湖区'];
  const currentAlarms = db.prepare(`
    SELECT m.district AS area, COUNT(a.id) AS cnt
    FROM alarms a
    JOIN manholes m ON m.id = a.manhole_id
    WHERE a.created_at >= datetime('now', '-${days} days') AND m.district IS NOT NULL
    GROUP BY m.district
  `).all();
  const previousAlarms = db.prepare(`
    SELECT m.district AS area, COUNT(a.id) AS cnt
    FROM alarms a
    JOIN manholes m ON m.id = a.manhole_id
    WHERE a.created_at >= datetime('now', '-${days * 2} days') AND a.created_at < datetime('now', '-${days} days') AND m.district IS NOT NULL
    GROUP BY m.district
  `).all();
  const curMap = Object.fromEntries(currentAlarms.map(r => [r.area, r.cnt]));
  const prevMap = Object.fromEntries(previousAlarms.map(r => [r.area, r.cnt]));
  const comparisonData = areas.map(area => {
    const cur = curMap[area] || 0;
    const prev = prevMap[area] || 0;
    const change = prev === 0 ? (cur > 0 ? 100 : 0) : parseFloat((((cur - prev) / prev) * 100).toFixed(1));
    return { area, metric: '报警数', current: cur, previous: prev, change };
  });

  res.json({
    data: {
      trendData: trendData.map(r => ({ ...r, temperature: Math.round(r.temperature * 100) / 100, humidity: Math.round(r.humidity * 100) / 100, waterLevel: Math.round(r.waterLevel * 100) / 100, gasConcentration: Math.round(r.gasConcentration * 100) / 100, batteryLevel: Math.round(r.batteryLevel * 100) / 100 })),
      distributionData: distributionData.map(r => ({ ...r, temperature: Math.round(r.temperature * 100) / 100, humidity: Math.round(r.humidity * 100) / 100, waterLevel: Math.round(r.waterLevel * 100) / 100, gasConcentration: Math.round(r.gasConcentration * 100) / 100 })),
      correlationData,
      anomalyData,
      comparisonData,
    }
  });
});

router.get('/district-summary', (req, res) => {
  const db = getDb();
  const districts = db.prepare(`
    SELECT m.district,
           COUNT(DISTINCT m.id) AS manholeCount,
           COUNT(DISTINCT a.id) AS alarmCount,
           AVG(hs.total_score) AS avgHealth
    FROM manholes m
    LEFT JOIN alarms a ON a.manhole_id = m.id AND a.is_resolved = 0
    LEFT JOIN health_scores hs ON hs.manhole_id = m.id
      AND hs.recorded_at IN (SELECT MAX(recorded_at) FROM health_scores WHERE manhole_id = m.id)
    WHERE m.district IS NOT NULL
    GROUP BY m.district
    ORDER BY manholeCount DESC
  `).all();

  const onlineStats = db.prepare(`
    SELECT m.district,
           COUNT(*) AS total,
           SUM(CASE WHEN m.status = 'normal' THEN 1 ELSE 0 END) AS online
    FROM manholes m
    WHERE m.district IS NOT NULL
    GROUP BY m.district
  `).all();
  const onlineMap = Object.fromEntries(onlineStats.map(r => [r.district, r.total > 0 ? r.online / r.total : 0]));

  res.json({
    data: {
      districts: districts.map(d => ({
        ...d,
        avgHealth: Math.round((d.avgHealth || 0) * 100) / 100,
        onlineRate: parseFloat((onlineMap[d.district] || 0).toFixed(2)),
      })),
    }
  });
});

router.get('/report', (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 7;

  const totalManholes = db.prepare('SELECT COUNT(*) AS c FROM manholes').get().c;
  const deviceReport = db.prepare(`
    SELECT m.name,
           CAST((julianday('now') - julianday(m.installation_date)) / 365 * 100 AS INTEGER) AS uptime,
           COALESCE(al.c, 0) AS alarmCount,
           COALESCE(mt.c, 0) AS maintenanceCount,
           COALESCE(rt.battery_level, 0) AS batteryAvg
    FROM manholes m
    LEFT JOIN (SELECT manhole_id, COUNT(*) AS c FROM alarms GROUP BY manhole_id) al ON al.manhole_id = m.id
    LEFT JOIN (SELECT manhole_id, COUNT(*) AS c FROM maintenance_records GROUP BY manhole_id) mt ON mt.manhole_id = m.id
    LEFT JOIN (SELECT manhole_id, battery_level, recorded_at FROM real_time_data WHERE (manhole_id, recorded_at) IN (SELECT manhole_id, MAX(recorded_at) FROM real_time_data GROUP BY manhole_id)) rt ON rt.manhole_id = m.id
    ORDER BY m.name LIMIT 50
  `).all();

  const areaReport = db.prepare(`
    SELECT m.district AS area,
           COUNT(DISTINCT m.id) AS deviceCount,
           ROUND(CAST(SUM(CASE WHEN m.status = 'normal' THEN 1 ELSE 0 END) AS REAL) / COUNT(*), 2) AS onlineRate,
           COALESCE(SUM(al.c), 0) AS alarms,
           AVG(hs.total_score) AS avgHealth
    FROM manholes m
    LEFT JOIN (SELECT manhole_id, COUNT(*) AS c FROM alarms WHERE is_resolved = 0 GROUP BY manhole_id) al ON al.manhole_id = m.id
    LEFT JOIN (SELECT manhole_id, AVG(total_score) AS total_score FROM health_scores WHERE recorded_at >= datetime('now', '-7 days') GROUP BY manhole_id) hs ON hs.manhole_id = m.id
    WHERE m.district IS NOT NULL
    GROUP BY m.district
  `).all();

  const statusCounts = db.prepare('SELECT status, COUNT(*) AS c FROM manholes GROUP BY status').all();
  const weekStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM alarms WHERE created_at >= datetime('now', '-7 days')) AS thisWeek,
      (SELECT COUNT(*) FROM alarms WHERE created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')) AS lastWeek
  `).get();
  const wowChange = weekStats.lastWeek === 0 ? 0 : parseFloat((((weekStats.thisWeek - weekStats.lastWeek) / weekStats.lastWeek) * 100).toFixed(1));
  const statusReport = {
    normal: 0, warning: 0, alarm: 0, offline: 0,
    batteryAvg: Math.round((db.prepare('SELECT AVG(battery_level) AS v FROM real_time_data WHERE (manhole_id, recorded_at) IN (SELECT manhole_id, MAX(recorded_at) FROM real_time_data GROUP BY manhole_id)').get().v || 0) * 100) / 100,
    signalAvg: Math.round((db.prepare('SELECT AVG(signal_strength) AS v FROM real_time_data WHERE (manhole_id, recorded_at) IN (SELECT manhole_id, MAX(recorded_at) FROM real_time_data GROUP BY manhole_id)').get().v || 0) * 100) / 100,
    weekOverWeek: wowChange,
  };
  for (const s of statusCounts) {
    if (statusReport[s.status] !== undefined) statusReport[s.status] = s.c;
  }

  const totalAlarms = db.prepare('SELECT COUNT(*) AS c FROM alarms').get().c;
  const resolvedAlarms = db.prepare('SELECT COUNT(*) AS c FROM alarms WHERE is_resolved = 1').get().c;
  const alarmByLevel = db.prepare('SELECT level, COUNT(*) AS c FROM alarms GROUP BY level').all();
  const avgRespRow = db.prepare(`
    SELECT AVG((julianday(confirmed_at) - julianday(created_at)) * 24 * 60) AS avgMin
    FROM alarms WHERE confirmed_at IS NOT NULL
  `).get();
  const alarmReport = {
    total: totalAlarms,
    resolved: resolvedAlarms,
    resolveRate: totalAlarms > 0 ? Math.round((resolvedAlarms / totalAlarms) * 10000) / 100 : 0,
    avgResponseTime: Math.round(avgRespRow.avgMin || 0),
    byLevel: Object.fromEntries(alarmByLevel.map(a => [a.level, a.c])),
  };

  const totalMaint = db.prepare('SELECT COUNT(*) AS c FROM maintenance_records').get().c;
  const completedMaint = db.prepare("SELECT COUNT(*) AS c FROM maintenance_records WHERE status = 'completed'").get().c;
  const maintByType = db.prepare('SELECT type, COUNT(*) AS c FROM maintenance_records GROUP BY type').all();
  const avgDurRow = db.prepare(`
    SELECT AVG((julianday(completed_at) - julianday(created_at)) * 24) AS avgHours
    FROM maintenance_records WHERE status = 'completed' AND completed_at IS NOT NULL
  `).get();
  const maintenanceReport = {
    total: totalMaint,
    completed: completedMaint,
    completionRate: totalMaint > 0 ? Math.round((completedMaint / totalMaint) * 10000) / 100 : 0,
    avgDuration: Math.round(avgDurRow.avgHours || 0),
    byType: Object.fromEntries(maintByType.map(m => [m.type, m.c])),
  };

  res.json({
    data: {
      deviceReport: deviceReport.map(d => ({ ...d, batteryAvg: Math.round((d.batteryAvg || 0) * 100) / 100 })),
      areaReport: areaReport.map(a => ({ ...a, onlineRate: Math.round((a.onlineRate || 0) * 100) / 100, avgHealth: Math.round((a.avgHealth || 0) * 100) / 100 })),
      statusReport,
      alarmReport,
      maintenanceReport,
    }
  });
});

module.exports = router;
