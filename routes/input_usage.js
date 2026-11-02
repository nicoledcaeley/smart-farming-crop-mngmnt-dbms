const express = require('express');
const router = express.Router();
const db = require('../config/db');

async function renderPage(res, extra = {}) {
  const [plantings] = await db.query(
    `SELECT p.planting_id, f.field_name, c.crop_name
     FROM plantings p
     JOIN fields f ON p.field_id = f.field_id
     JOIN crops c ON p.crop_id = c.crop_id
     WHERE p.status = 'Active' ORDER BY p.planting_id`);
  const [farmInputs] = await db.query(
    'SELECT input_id, input_name, unit, stock_qty FROM farm_inputs ORDER BY input_name');
  const [usages] = await db.query(
    `SELECT u.usage_id, u.planting_id, i.input_name, i.unit, u.quantity_used,
            DATE_FORMAT(u.usage_date, '%Y-%m-%d') AS usage_date
     FROM input_usage u
     JOIN farm_inputs i ON u.input_id = i.input_id
     ORDER BY u.usage_id`);
  res.render('input_usage', { plantings, farmInputs, usages, error: null, ...extra });
}

router.get('/input-usage', async (req, res) => {
  try { await renderPage(res); }
  catch (e) { console.error(e); res.status(500).send('Database error'); }
});

router.post('/input-usage/add', async (req, res) => {
  const { planting_id, input_id, quantity_used, usage_date } = req.body;
  const qty = parseFloat(quantity_used);
  const usedBy = (req.session && req.session.user && req.session.user.user_id) || 1;
  try {
    if (!planting_id || !input_id || !usage_date || !(qty > 0)) {
      res.status(400);
      return await renderPage(res, { error: 'Fill in every field. Quantity must be above 0.' });
    }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        'SELECT stock_qty FROM farm_inputs WHERE input_id = ? FOR UPDATE', [input_id]);
      if (!rows.length) throw new Error('NO_INPUT');
      const stock = parseFloat(rows[0].stock_qty);
      if (qty > stock) { const err = new Error('NOT_ENOUGH'); err.stock = stock; throw err; }
      await conn.query(
        'INSERT INTO input_usage (planting_id, input_id, quantity_used, usage_date, used_by) VALUES (?, ?, ?, ?, ?)',
        [planting_id, input_id, qty, usage_date, usedBy]);
      await conn.query(
        'UPDATE farm_inputs SET stock_qty = stock_qty - ? WHERE input_id = ?', [qty, input_id]);
      await conn.commit();
      res.redirect('/input-usage');
    } catch (e) {
      await conn.rollback();
      console.error(e);
      res.status(400);
      let msg = 'Could not save. Nothing was changed.';
      if (e.message === 'NOT_ENOUGH') msg = 'Not enough stock. Only ' + e.stock + ' left.';
      if (e.message === 'NO_INPUT') msg = 'That farm input does not exist.';
      await renderPage(res, { error: msg });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Database error');
  }
});

module.exports = router;
