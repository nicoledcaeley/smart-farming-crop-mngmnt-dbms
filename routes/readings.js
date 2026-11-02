const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, f.field_name
      FROM sensor_readings r
      LEFT JOIN fields f ON r.field_id = f.field_id
      ORDER BY r.reading_time DESC
    `);
    res.render('readings', { readings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/field/:field_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sensor_readings WHERE field_id = ? ORDER BY reading_time DESC',
      [req.params.field_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/', async (req, res) => {
  const { field_id, metric, value } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO sensor_readings (field_id, metric, value, reading_time) VALUES (?, ?, ?, NOW())',
      [field_id, metric, value]
    );
    const reading_id = result.insertId;
    const [thresholds] = await conn.query(
      'SELECT * FROM thresholds WHERE field_id = ? AND metric = ?',
      [field_id, metric]
    );
    for (const th of thresholds) {
      let violated = false;
      let message = '';
      if (th.min_value != null && parseFloat(value) < th.min_value) {
        violated = true;
        message = `${metric} too low: ${value} < ${th.min_value}`;
      }
      if (th.max_value != null && parseFloat(value) > th.max_value) {
        violated = true;
        message = `${metric} too high: ${value} > ${th.max_value}`;
      }
      if (violated) {
        await conn.query(
          'INSERT INTO alerts (field_id, reading_id, threshold_id, severity, message, status, created_at) VALUES (?, ?, ?, ?, ?, "Open", NOW())',
          [field_id, reading_id, th.threshold_id, th.severity || 'Medium', message]
        );
      }
    }
    if (metric === 'soil_moisture') {
      const moist = parseFloat(value);
      const [rainRows] = await conn.query(
        'SELECT * FROM weather_data WHERE field_id = ? AND rain_mm > 0 AND date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY) LIMIT 1',
        [field_id]
      );
      const hasRain = rainRows.length > 0;
      if (moist >= 40 && hasRain) {
        await conn.query(
          "INSERT INTO tasks (field_id, reading_id, type, status, notes, created_at) VALUES (?, ?, 'irrigation', 'Skipped', 'Skipped: recent rain', NOW())",
          [field_id, reading_id]
        );
      } else if (moist <= 35 && !hasRain) {
        await conn.query(
          "INSERT INTO tasks (field_id, reading_id, type, status, notes, created_at) VALUES (?, ?, 'irrigation', 'Pending', 'Needs irrigation', NOW())",
          [field_id, reading_id]
        );
      }
    }
    await conn.query(
      'INSERT INTO audit_logs (action, table_name, record_id, created_at) VALUES ("INSERT", "sensor_readings", ?, NOW())',
      [reading_id]
    );
    await conn.commit();
    res.redirect('/readings');
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).send('Database error: ' + err.message);
  } finally {
    conn.release();
  }
});

module.exports = router;
