
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [predictions] = await db.query(`
            SELECT
                p.planting_id,
                c.crop_name,
                p.planting_date,
                c.days_to_maturity,
                DATE_ADD(
                    p.planting_date,
                    INTERVAL c.days_to_maturity DAY
                ) AS predicted_harvest_date,
                DATEDIFF(
                    DATE_ADD(
                        p.planting_date,
                        INTERVAL c.days_to_maturity DAY
                    ),
                    CURDATE()
                ) AS days_remaining,
                CASE
                    WHEN DATEDIFF(
                        DATE_ADD(
                            p.planting_date,
                            INTERVAL c.days_to_maturity DAY
                        ),
                        CURDATE()
                    ) <= 0 THEN 'Ready to harvest'
                    ELSE 'Growing'
                END AS harvest_status
            FROM plantings p
            JOIN crops c ON p.crop_id = c.crop_id
            WHERE p.status = 'Active'
            ORDER BY predicted_harvest_date
        `);

        res.render('harvest-prediction', { predictions });
    } catch (error) {
        console.error('Harvest prediction error:', error);
        res.status(500).send('Unable to load harvest predictions.');
    }
});

module.exports = router;
