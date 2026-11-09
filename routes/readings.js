const { allowRoles } = require('../middleware/permissions');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', allowRoles('Admin','Farm Manager','Farmer'), async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, f.field_name
      FROM sensor_readings r
      LEFT JOIN fields f ON r.field_id = f.field_id
      ORDER BY r.reading_time DESC
    `);
    res.render('readings', { readings: rows });
  } catch (err) {
    console.error('READINGS GET ERROR:', err);
    res.status(500).send('<h1>REAL READINGS ERROR:</h1><pre>' + err.message + '</pre>');
  }
});

module.exports = router;
