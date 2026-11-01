const express = require('express');
const router = express.Router();
const db = require('../config/db');

async function getConn() {
  const p = db;
  return typeof p.getConnection === 'function' ? await p.getConnection() : p;
}

async function renderPage(res, extra = {}) {
  const [plantings] = await db.query(
    "SELECT planting_id, DATE_FORMAT(planting_date, '%Y-%m-%d') AS planting_date FROM plantings WHERE status = 'Active' ORDER BY planting_id");
  const [harvests] = await db.query(
    "SELECT harvest_id, planting_id, DATE_FORMAT(harvest_date, '%Y-%m-%d') AS harvest_date, quantity_kg, quality_grade FROM harvests ORDER BY harvest_id");
  res.render('harvests', { plantings, harvests, error: null, ...extra });
}

router.get('/harvests', async (req, res) => {
  try { await renderPage(res); }
  catch (e) { console.error(e); res.status(500).send('Database error'); }
});

router.post('/harvests/add', async (req, res) => {
  const { planting_id, harvest_date, quantity_kg, quality_grade } = req.body;
  const qty = parseFloat(quantity_kg);
  const recordedBy = (req.session && req.session.user && req.session.user.user_id) || 1;

  try {
    if (!planting_id || !harvest_date || !(qty > 0) || !['A', 'B', 'C'].includes(quality_grade)) {
      res.status(400);
      return await renderPage(res, { error: 'Fill in every field. Quantity must be above 0 and grade must be A, B or C.' });
    }
    const conn = await getConn();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        "SELECT field_id, status FROM plantings WHERE planting_id = ? FOR UPDATE", [planting_id]);
      if (!rows.length || rows[0].status !== 'Active') throw new Error('NOT_ACTIVE');
      await conn.query(
        "INSERT INTO harvests (planting_id, harvest_date, quantity_kg, quality_grade, recorded_by) VALUES (?, ?, ?, ?, ?)",
        [planting_id, harvest_date, qty, quality_grade, recordedBy]);
      await conn.query("UPDATE plantings SET status = 'Harvested' WHERE planting_id = ?", [planting_id]);
      await conn.query("UPDATE fields SET status = 'Idle' WHERE field_id = ?", [rows[0].field_id]);
      await conn.commit();
      res.redirect('/harvests');
    } catch (e) {
      await conn.rollback();
      console.error(e);
      res.status(400);
      await renderPage(res, {
        error: e.message === 'NOT_ACTIVE'
          ? 'That planting is not Active, so it cannot be harvested.'
          : 'Could not save the harvest. Nothing was changed.'
      });
    } finally {
      if (conn.release) conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Database error');
  }
});

module.exports = router;
