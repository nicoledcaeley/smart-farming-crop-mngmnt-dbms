const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    res.render('index');
});

router.get('/plantings', async (req, res) => {
    try {
        const [plantings] = await pool.query(`
            SELECT p.planting_id, f.field_name, c.crop_name,  
                   DATE_FORMAT(p.planting_date, '%Y-%m-%d') AS planting_date, 
                   DATE_FORMAT(p.expected_harvest_date, '%Y-%m-%d') AS expected_harvest_date, 
                   p.status 
            FROM plantings p
            JOIN fields f ON p.field_id = f.field_id
            JOIN crops c ON p.crop_id = c.crop_id
        `);
        const [idleFields] = await pool.query("SELECT * FROM fields WHERE status = 'Idle'");
        const [crops] = await pool.query('SELECT * FROM crops');
        res.render('plantings', { plantings, idleFields, crops });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.get('/input-usage', async (req, res) => {
    try {
        const [usageRecords] = await pool.query(`
            SELECT u.usage_id, u.planting_id, i.input_name, u.quantity_used, 
                   DATE_FORMAT(u.usage_date, '%Y-%m-%d') AS date_used 
            FROM input_usage u
            JOIN farm_inputs i ON u.input_id = i.input_id
        `);
        const [plantings] = await pool.query(`
            SELECT p.planting_id, f.field_name, c.crop_name 
            FROM plantings p
            JOIN fields f ON p.field_id = f.field_id
            JOIN crops c ON p.crop_id = c.crop_id
        `);
        const [farmInputs] = await pool.query('SELECT * FROM farm_inputs');
        res.render('input_usage', { usageRecords, plantings, farmInputs });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Fallback alias in case templates point to /user-input
router.get('/user-input', (req, res) => {
    res.redirect('/input-usage');
});

module.exports = router;
