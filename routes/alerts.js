const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, f.field_name, r.metric, r.value
      FROM alerts a
      LEFT JOIN fields f ON a.field_id = f.field_id
      LEFT JOIN sensor_readings r ON a.reading_id = r.reading_id
      ORDER BY a.created_at DESC
    `);
    res.render('alerts', { alerts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// GET alerts by field
router.get('/field/:field_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM alerts WHERE field_id = ? ORDER BY created_at DESC',
      [req.params.field_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// POST acknowledge alert
router.post('/acknowledge/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE alerts SET status = "Acknowledged", acknowledged_at = NOW() WHERE alert_id = ?',
      [req.params.id]
    );
    res.redirect('/alerts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// POST resolve alert
router.post('/resolve/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE alerts SET status = "Resolved", resolved_at = NOW() WHERE alert_id = ?',
      [req.params.id]
    );
    res.redirect('/alerts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
