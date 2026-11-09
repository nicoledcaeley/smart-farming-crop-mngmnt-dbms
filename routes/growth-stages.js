const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ========================================
// 1. DISPLAY ALL GROWTH STAGES
// ========================================
router.get('/', async (req, res) => {
    try {
        const [crops] = await pool.query(
            `SELECT crop_id, crop_name
             FROM crops
             ORDER BY crop_name`
        );

        const [stages] = await pool.query(`
            SELECT
                cgs.stage_id,
                cgs.crop_id,
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
        console.error('Error loading growth stages:', err);
        res.status(500).send('Could not load growth stages.');
    }
});

// ========================================
// 2. ADD A NEW GROWTH STAGE
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            crop_id,
            stage_name,
            stage_order,
            start_day,
            end_day
        } = req.body;

        const cropId = Number(crop_id);
        const stageOrder = Number(stage_order);
        const startDay = Number(start_day);
        const endDay = Number(end_day);

        if (
            !Number.isInteger(cropId) ||
            cropId < 1 ||
            typeof stage_name !== 'string' ||
            !stage_name.trim() ||
            !Number.isInteger(stageOrder) ||
            stageOrder < 1 ||
            !Number.isInteger(startDay) ||
            startDay < 0 ||
            !Number.isInteger(endDay) ||
            endDay < startDay
        ) {
            return res.status(400).send(
                'Invalid input. Check the crop, stage name, order, and day values.'
            );
        }

        await pool.query(
            `INSERT INTO crop_growth_stages
                (crop_id, stage_name, stage_order, start_day, end_day)
             VALUES (?, ?, ?, ?, ?)`,
            [
                cropId,
                stage_name.trim(),
                stageOrder,
                startDay,
                endDay
            ]
        );

        res.redirect('/growth-stages');
    } catch (err) {
        console.error('Error adding growth stage:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send(
                'This crop already has a growth stage with that order.'
            );
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).send('The selected crop does not exist.');
        }

        res.status(500).send('Could not save the growth stage.');
    }
});

// ========================================
// 3. UPDATE AN EXISTING GROWTH STAGE
// ========================================
router.post('/:stage_id/update', async (req, res) => {
    try {
        const stageId = Number(req.params.stage_id);

        const {
            crop_id,
            stage_name,
            stage_order,
            start_day,
            end_day
        } = req.body;

        const cropId = Number(crop_id);
        const stageOrder = Number(stage_order);
        const startDay = Number(start_day);
        const endDay = Number(end_day);

        if (
            !Number.isInteger(stageId) ||
            stageId < 1 ||
            !Number.isInteger(cropId) ||
            cropId < 1 ||
            typeof stage_name !== 'string' ||
            !stage_name.trim() ||
            !Number.isInteger(stageOrder) ||
            stageOrder < 1 ||
            !Number.isInteger(startDay) ||
            startDay < 0 ||
            !Number.isInteger(endDay) ||
            endDay < startDay
        ) {
            return res.status(400).send(
                'Invalid input. Check the crop, stage name, order, and day values.'
            );
        }

        const [result] = await pool.query(
            `UPDATE crop_growth_stages
             SET crop_id = ?,
                 stage_name = ?,
                 stage_order = ?,
                 start_day = ?,
                 end_day = ?
             WHERE stage_id = ?`,
            [
                cropId,
                stage_name.trim(),
                stageOrder,
                startDay,
                endDay,
                stageId
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                `SELECT stage_id
                 FROM crop_growth_stages
                 WHERE stage_id = ?`,
                [stageId]
            );

            if (existing.length === 0) {
                return res.status(404).send('Growth stage not found.');
            }
        }

        res.redirect('/growth-stages');
    } catch (err) {
        console.error('Error updating growth stage:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send(
                'This crop already has a growth stage with that order.'
            );
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).send('The selected crop does not exist.');
        }

        res.status(500).send('Could not update the growth stage.');
    }
});

// ========================================
// 4. DELETE A GROWTH STAGE
// ========================================
router.post('/:stage_id/delete', async (req, res) => {
    try {
        const stageId = Number(req.params.stage_id);

        if (!Number.isInteger(stageId) || stageId < 1) {
            return res.status(400).send('Invalid growth stage ID.');
        }

        const [result] = await pool.query(
            `DELETE FROM crop_growth_stages
             WHERE stage_id = ?`,
            [stageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Growth stage not found.');
        }

        res.redirect('/growth-stages');
    } catch (err) {
        console.error('Error deleting growth stage:', err);

        res.status(500).send(
            'Could not delete the growth stage. It may be referenced by other records.'
        );
    }
});

module.exports = router;