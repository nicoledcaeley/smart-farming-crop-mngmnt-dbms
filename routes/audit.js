const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

router.get('/', allowRoles('Admin', 'Farm Manager', 'Farmer', 'Agronomist'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, COALESCE(u.username, 'System') AS user_display
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      ORDER BY l.created_at DESC
    `);
    res.render('audit', { logs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
