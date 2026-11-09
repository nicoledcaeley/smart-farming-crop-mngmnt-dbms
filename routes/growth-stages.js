const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {

        const [crops] = await pool.query(
            'SELECT crop_id, crop_name FROM crops ORDER BY crop_name'
        );

        const [stages] = await pool.query(`
            SELECT
                cgs.stage_id,
                c.crop_name,
                cgs.stage_name,
                cgs.stage_order,
                cgs.start_day,
                cgs.end_day
            FROM crop_growth_stages cgs
            INNER JOIN crops c
                ON cgs.crop_id = c.crop_id
            ORDER BY c.crop_name, cgs.stage_order
        `);

        res.render('growth-stages', {
            crops,
            stages
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            crop_id,
            stage_name,
            stage_order,
            start_day,
            end_day
        } = req.body;

        // Validate the input values
        if (
            !crop_id ||
            !stage_name.trim() ||
            !Number.isInteger(Number(stage_order)) ||
            Number(stage_order) < 1 ||
            !Number.isInteger(Number(start_day)) ||
            Number(start_day) < 0 ||
            !Number.isInteger(Number(end_day)) ||
            Number(end_day) < Number(start_day)
        ) {
            return res.status(400).send(
                'Invalid input. Check the stage name, order, and day values.'
            );
        }

        // Save the growth stage to MySQL
        await pool.query(
            `INSERT INTO crop_growth_stages
                (crop_id, stage_name, stage_order, start_day, end_day)
             VALUES (?, ?, ?, ?, ?)`,
            [
                crop_id,
                stage_name.trim(),
                stage_order,
                start_day,
                end_day
            ]
        );

        res.redirect('/growth-stages');

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send(
                'This crop already has a growth stage with that order.'
            );
        }

        res.status(500).send('Could not save the growth stage.');
    }
});

module.exports = router;