const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Report: every planting with the total of each farm input used on it.
// INNER JOIN: plantings + fields + crops (always exist)
// LEFT JOIN: input_usage + farm_inputs (a planting with no inputs still shows)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.planting_id, f.field_name, c.crop_name, p.status,
              i.input_name, i.unit,
              COALESCE(SUM(u.quantity_used), 0) AS total_used
       FROM plantings p
       INNER JOIN fields f ON p.field_id = f.field_id
       INNER JOIN crops c ON p.crop_id = c.crop_id
       LEFT JOIN input_usage u ON u.planting_id = p.planting_id
       LEFT JOIN farm_inputs i ON u.input_id = i.input_id
       GROUP BY p.planting_id, f.field_name, c.crop_name, p.status,
                i.input_id, i.input_name, i.unit
       ORDER BY p.planting_id, i.input_name`);
    res.render('planting-inputs', { rows });
  } catch (e) {
    console.error(e);
    res.status(500).send('Database error');
  }
});

module.exports = router;
