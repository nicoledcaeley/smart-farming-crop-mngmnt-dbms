const express = require('express');
const router = express.Router();
const db = require('../config/db');

const STATUSES = ['Active', 'Harvested', 'Failed'];

async function renderPage(res, extra = {}) {
  const [idleFields] = await db.query(
    "SELECT field_id, field_name FROM fields WHERE status = 'Idle' ORDER BY field_name");
  const [crops] = await db.query(
    'SELECT crop_id, crop_name, days_to_maturity FROM crops ORDER BY crop_name');
  const [plantings] = await db.query(
    `SELECT p.planting_id, f.field_name, c.crop_name, u.full_name AS planted_by_name,
            DATE_FORMAT(p.planting_date, '%Y-%m-%d') AS planting_date,
            DATE_FORMAT(p.expected_harvest_date, '%Y-%m-%d') AS expected_harvest_date,
            p.status
     FROM plantings p
     JOIN fields f ON p.field_id = f.field_id
     JOIN crops c ON p.crop_id = c.crop_id
     LEFT JOIN users u ON p.planted_by = u.user_id
     ORDER BY p.planting_id`);
  res.render('plantings', { idleFields, crops, plantings, error: null, ...extra });
}

async function renderEdit(res, id, extra = {}) {
  const [rows] = await db.query(
    `SELECT p.planting_id, p.crop_id, p.status, f.field_name,
            DATE_FORMAT(p.planting_date, '%Y-%m-%d') AS planting_date,
            DATE_FORMAT(p.expected_harvest_date, '%Y-%m-%d') AS expected_harvest_date
     FROM plantings p JOIN fields f ON p.field_id = f.field_id
     WHERE p.planting_id = ?`, [id]);
  if (!rows.length) return res.status(404).send('Planting not found');
  const [crops] = await db.query(
    'SELECT crop_id, crop_name FROM crops ORDER BY crop_name');
  res.render('edit-planting', { planting: rows[0], crops, error: null, ...extra });
}

router.get('/plantings', async (req, res) => {
  try { await renderPage(res); }
  catch (e) { console.error(e); res.status(500).send('Database error'); }
});

router.post('/plantings/add', async (req, res) => {
  const { field_id, crop_id, planting_date } = req.body;
  const plantedBy = (req.session && req.session.user && req.session.user.user_id) || 1;
  try {
    if (!field_id || !crop_id || !planting_date) {
      res.status(400);
      return await renderPage(res, { error: 'Fill in every field.' });
    }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [f] = await conn.query(
        'SELECT status FROM fields WHERE field_id = ? FOR UPDATE', [field_id]);
      if (!f.length || f[0].status !== 'Idle') throw new Error('NOT_IDLE');
      const [c] = await conn.query(
        'SELECT days_to_maturity FROM crops WHERE crop_id = ?', [crop_id]);
      if (!c.length) throw new Error('NO_CROP');
      await conn.query(
        `INSERT INTO plantings (field_id, crop_id, planted_by, planting_date, expected_harvest_date, status)
         VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'Active')`,
        [field_id, crop_id, plantedBy, planting_date, planting_date, c[0].days_to_maturity]);
      await conn.query("UPDATE fields SET status = 'Planted' WHERE field_id = ?", [field_id]);
      await conn.commit();
      res.redirect('/plantings');
    } catch (e) {
      await conn.rollback();
      console.error(e);
      res.status(400);
      let msg = 'Could not save. Nothing was changed.';
      if (e.message === 'NOT_IDLE') msg = 'That field is not idle, so it cannot be planted.';
      if (e.message === 'NO_CROP') msg = 'That crop does not exist.';
      await renderPage(res, { error: msg });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Database error');
  }
});

router.get('/plantings/edit/:id', async (req, res) => {
  try { await renderEdit(res, req.params.id); }
  catch (e) { console.error(e); res.status(500).send('Database error'); }
});

router.post('/plantings/update/:id', async (req, res) => {
  const id = req.params.id;
  const { crop_id, planting_date, expected_harvest_date, status } = req.body;
  try {
    if (!crop_id || !planting_date || !STATUSES.includes(status)) {
      res.status(400);
      return await renderEdit(res, id, { error: 'Fill in every field with valid values.' });
    }
    if (expected_harvest_date && expected_harvest_date < planting_date) {
      res.status(400);
      return await renderEdit(res, id, { error: 'Expected harvest cannot be before the planting date.' });
    }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        'SELECT field_id FROM plantings WHERE planting_id = ? FOR UPDATE', [id]);
      if (!rows.length) throw new Error('NOT_FOUND');
      await conn.query(
        `UPDATE plantings SET crop_id = ?, planting_date = ?, expected_harvest_date = ?, status = ?
         WHERE planting_id = ?`,
        [crop_id, planting_date, expected_harvest_date || null, status, id]);
      await conn.query('UPDATE fields SET status = ? WHERE field_id = ?',
        [status === 'Active' ? 'Planted' : 'Idle', rows[0].field_id]);
      await conn.commit();
      res.redirect('/plantings');
    } catch (e) {
      await conn.rollback();
      console.error(e);
      if (e.message === 'NOT_FOUND') return res.status(404).send('Planting not found');
      res.status(400);
      await renderEdit(res, id, { error: 'Could not update. Nothing was changed.' });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Database error');
  }
});

router.post('/plantings/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        'SELECT field_id, status FROM plantings WHERE planting_id = ? FOR UPDATE', [id]);
      if (!rows.length) throw new Error('NOT_FOUND');
      await conn.query('DELETE FROM plantings WHERE planting_id = ?', [id]);
      if (rows[0].status === 'Active') {
        await conn.query("UPDATE fields SET status = 'Idle' WHERE field_id = ?", [rows[0].field_id]);
      }
      await conn.commit();
      res.redirect('/plantings');
    } catch (e) {
      await conn.rollback();
      console.error(e);
      let msg = 'Could not delete. Nothing was changed.';
      if (e.errno === 1451) msg = 'Cannot delete planting #' + id + ': it has harvest or input usage records.';
      if (e.message === 'NOT_FOUND') msg = 'That planting does not exist.';
      res.status(409);
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
