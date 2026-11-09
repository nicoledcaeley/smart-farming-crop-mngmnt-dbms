const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        // Get the list of crops
        const [crops] = await db.query(
            'SELECT crop_id, crop_name FROM crops ORDER BY crop_name'
        );

        // Get crop thresholds with their corresponding crop names
        const [thresholds] = await db.query(`
            SELECT ct.*, c.crop_name
            FROM crop_thresholds AS ct
            INNER JOIN crops AS c
                ON ct.crop_id = c.crop_id
            ORDER BY c.crop_name, ct.metric_name
        `);

        // Display the Crop Thresholds page
        res.render('thresholds', {
            crops: crops,
            thresholds: thresholds
        });

    } catch (err) {
        console.error('Error loading crop thresholds:', err);
        res.status(500).send('Database error');
    }
});

module.exports = router;