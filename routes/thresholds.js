
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

console.log('Crop Thresholds route loaded');

// Display the Crop Thresholds page
router.get('/', async (req, res) => {
    console.log('GET /thresholds route reached');
    
    try {
        const [crops] = await pool.query(
            'SELECT crop_id, crop_name FROM crops ORDER BY crop_name'
        );

        const [thresholds] = await pool.query(`
            SELECT
                ct.threshold_id,
                c.crop_name,
                ct.metric,
                ct.min_value,
                ct.max_value
            FROM crop_thresholds ct
            INNER JOIN crops c
                ON ct.crop_id = c.crop_id
            ORDER BY c.crop_name, ct.metric
        `);

        res.render('thresholds', {
            crops: crops,
            thresholds: thresholds
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


 // Save a new Crop Threshold
router.post('/', async (req, res) => {
    try {
        const cropId = Number(req.body.crop_id);
        const metric = req.body.metric;
        const minValue = Number(req.body.min_value);
        const maxValue = Number(req.body.max_value);

        const allowedMetrics = [
            'soil_moisture',
            'temperature',
            'ph'
        ];

        if (
            !Number.isInteger(cropId) ||
            cropId <= 0 ||
            !allowedMetrics.includes(metric) ||
            req.body.min_value === '' ||
            req.body.max_value === '' ||
            !Number.isFinite(minValue) ||
            !Number.isFinite(maxValue) ||
            minValue > maxValue
        ) {
            return res.status(400).send(
                'Invalid input. Check the crop, metric, and minimum and maximum values.'
            );
        }

        // Check that the selected crop exists
        const [crops] = await pool.query(
            'SELECT crop_id FROM crops WHERE crop_id = ?',
            [cropId]
        );

        if (crops.length === 0) {
            return res.status(400).send('Selected crop does not exist.');
        }

        // Prevent duplicate metrics for the same crop
        const [existing] = await pool.query(
            `SELECT threshold_id
             FROM crop_thresholds
             WHERE crop_id = ? AND metric = ?`,
            [cropId, metric]
        );

        if (existing.length > 0) {
            return res.status(400).send(
                'A threshold for this crop and metric already exists.'
            );
        }

        // Save the new threshold
        await pool.query(
            `INSERT INTO crop_thresholds
                (crop_id, metric, min_value, max_value)
             VALUES (?, ?, ?, ?)`,
            [cropId, metric, minValue, maxValue]
        );

        res.redirect('/thresholds');

    } catch (err) {
        console.error(err);
        res.status(500).send('Could not save crop threshold.');
    }
});

module.exports = router;