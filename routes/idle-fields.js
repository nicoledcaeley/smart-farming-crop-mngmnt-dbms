const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET: Display fields without active plantings
router.get('/', async (req, res) => {
    try {
        const [fields] = await pool.query(`
            SELECT
                f.field_id,
                f.field_name,
                fa.farm_name
            FROM fields f
            INNER JOIN farms fa
                ON fa.farm_id = f.farm_id
            LEFT JOIN plantings p
                ON p.field_id = f.field_id
                AND p.status = 'Active'
            WHERE p.planting_id IS NULL
            ORDER BY fa.farm_name, f.field_name
        `);

        res.render('reports/idle-fields', {
            fields,
            error: null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load idle fields report.');
    }
});

module.exports = router;
