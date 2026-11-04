const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const { allowRoles } = require('../middleware/permissions');
router.get('/coverage',allowRoles('Admin','Farm Manager','Agronomist'),  async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT f.field_id, f.field_name, v.day AS log_date,
      CASE WHEN v.day IS NULL THEN 'field only' WHEN f.field_id IS NULL THEN 'weather only' ELSE 'both' END AS coverage_type
      FROM fields f LEFT JOIN v_sensor_days v ON f.farm_id = v.farm_id
      UNION
      SELECT f.field_id, f.field_name, v.day AS log_date,
      CASE WHEN v.day IS NULL THEN 'field only' WHEN f.field_id IS NULL THEN 'weather only' ELSE 'both' END AS coverage_type
      FROM fields f RIGHT JOIN v_sensor_days v ON f.farm_id = v.farm_id
      ORDER BY log_date DESC
    `);
    res.render('coverage', { coverage: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
