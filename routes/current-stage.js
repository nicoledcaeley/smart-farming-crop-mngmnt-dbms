
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

// GET: Display current stage for each planting
router.get('/', allowRoles('Admin', 'Farm Manager', 'Farmer', 'Agronomist'), async (req, res) => {
    try {
        const [plantings] = await pool.query(`
            SELECT
                p.planting_id,
                c.crop_name,
                p.planting_date,
                p.expected_harvest_date,
                s.stage_name AS current_stage,
                s.stage_order,
                p.status
            FROM plantings p
            INNER JOIN crops c
                ON p.crop_id = c.crop_id
            INNER JOIN crop_growth_stages s
                ON p.current_stage_id = s.stage_id
            ORDER BY p.planting_id
        `);

        res.render('reports/current-stage', {
            plantings
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load current stage report.');
    }
});

module.exports = router;
