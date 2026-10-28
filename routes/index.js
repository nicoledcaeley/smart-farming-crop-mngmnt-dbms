const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.render('index', { roles: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.get('/plantings', async (req, res) => {
    try {
        const [plantings] = await pool.query('SELECT * FROM plantings');
        res.render('plantings', { plantings });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching plantings');
    }
});

router.post('/plantings/add', async (req, res) => {
    try {
        const { field_id, crop_id, planted_by, planting_date, expected_harvest_date, status } = req.body;
        await pool.query(
            'INSERT INTO plantings (field_id, crop_id, planted_by, planting_date, expected_harvest_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [field_id, crop_id, planted_by, planting_date, expected_harvest_date, status]
        );
        res.redirect('/plantings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding planting record');
    }
});

// DELETE route
router.post('/plantings/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM plantings WHERE planting_id = ?', [id]);
        res.redirect('/plantings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting planting record');
    }
});

// EDIT GET route (Load single record for editing)
router.get('/plantings/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM plantings WHERE planting_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).send('Planting record not found');
        }
        res.render('edit-planting', { planting: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching planting for edit');
    }
});

// EDIT POST route (Save changes)
router.post('/plantings/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { field_id, crop_id, planted_by, planting_date, expected_harvest_date, status } = req.body;
        await pool.query(
            'UPDATE plantings SET field_id = ?, crop_id = ?, planted_by = ?, planting_date = ?, expected_harvest_date = ?, status = ? WHERE planting_id = ?',
            [field_id, crop_id, planted_by, planting_date, expected_harvest_date, status, id]
        );
        res.redirect('/plantings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating planting record');
    }
});

module.exports = router;
