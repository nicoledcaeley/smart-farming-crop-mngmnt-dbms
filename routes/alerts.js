const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT a.*, f.field_name, r.metric, r.value
      FROM alerts a
      LEFT JOIN fields f ON a.field_id = f.field_id
      LEFT JOIN sensor_readings r ON a.reading_id = r.reading_id
      WHERE 1=1
    `;
    const params = [];
    if (req.query.status) {
      query += ` AND a.status = ?`;
      params.push(req.query.status);
    }
    if (req.query.severity) {
      query += ` AND a.severity = ?`;
      params.push(req.query.severity);
    }
    query += ` ORDER BY a.created_at DESC`;
    const [rows] = await pool.query(query, params);
    res.render('alerts', { alerts: rows, filters: req.query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/field/:field_id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, f.field_name, r.metric, r.value
      FROM alerts a
      LEFT JOIN fields f ON a.field_id = f.field_id
      LEFT JOIN sensor_readings r ON a.reading_id = r.reading_id
      WHERE a.field_id = ?
      ORDER BY a.created_at DESC
    `, [req.params.field_id]);
    res.render('alerts', { alerts: rows, filters: {} });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/create', async (req, res) => {
  try {
    const { title, message, severity, field_id, reading_id } = req.body;
    if (!title || !message || !severity) {
      return res.status(400).send('Title, message, and severity are required');
    }
    const [result] = await pool.query(
      `INSERT INTO alerts (title, message, severity, field_id, reading_id, status) VALUES (?, ?, ?, ?, ?, 'Active')`,
      [title, message, severity, field_id || null, reading_id || null]
    );
    await pool.query(
      `INSERT INTO audit_logs (action, table_name, record_id, details) VALUES (?, ?, ?, ?)`,
      ['CREATE', 'alerts', result.insertId, `Created alert: ${title}`]
    );
    res.redirect('/alerts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/acknowledge/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE alerts SET status = 'Acknowledged', acknowledged_at = NOW() WHERE alert_id = ?`, [req.params.id]);
    await pool.query(`INSERT INTO audit_logs (action, table_name, record_id, details) VALUES (?, ?, ?, ?)`, ['UPDATE', 'alerts', req.params.id, 'Acknowledged alert']);
    res.redirect('/alerts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/resolve/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE alerts SET status = 'Resolved', resolved_at = NOW() WHERE alert_id = ?`, [req.params.id]);
    await pool.query(`INSERT INTO audit_logs (action, table_name, record_id, details) VALUES (?, ?, ?, ?)`, ['UPDATE', 'alerts', req.params.id, 'Resolved alert']);
    res.redirect('/alerts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
