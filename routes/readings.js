const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const [fields] = await db.query('SELECT * FROM fields');
    const [readings] = await db.query('SELECT r.*, f.field_name FROM sensor_readings r LEFT JOIN fields f ON r.field_id = f.field_id ORDER BY r.reading_time DESC');
    res.render('readings', { readings, fields });
  } catch (err) {
    console.error('READINGS GET ERROR:', err);
    res.status(500).send(`<h1>REAL READINGS ERROR:</h1><pre>${err.message}\n\n${err.stack}</pre>`);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { field_id, metric, value } = req.body;
    await db.query('INSERT INTO sensor_readings (field_id, metric, value) VALUES (?, ?, ?)', [field_id, metric, value]);
    res.redirect('/readings');
  } catch (err) {
    console.error('READINGS POST ERROR:', err);
    res.status(500).send(`<h1>REAL POST ERROR:</h1><pre>${err.message}\n\n${err.stack}</pre>`);
  }
});

module.exports = router;
