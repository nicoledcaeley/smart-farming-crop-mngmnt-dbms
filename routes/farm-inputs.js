const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

const inputTypes = ['Seed', 'Fertilizer', 'Pesticide', 'Other'];

// GET: Display all farm inputs
router.get('/', async (req, res) => {
    try {
        const [inputs] = await pool.query(`
            SELECT *,
                CASE
                    WHEN stock_qty <= reorder_level THEN 1
                    ELSE 0
                END AS low_stock
            FROM farm_inputs
            ORDER BY input_name
        `);

        res.render('farm-inputs', {
            inputs,
            error: null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load farm inputs.');
    }
});

// POST: Add a farm input
router.post('/', async (req, res) => {
    const { input_name, input_type, unit, stock_qty, reorder_level } = req.body;

    if (
        !input_name?.trim() ||
        !inputTypes.includes(input_type) ||
        !unit?.trim() ||
        !Number.isFinite(Number(stock_qty)) ||
        !Number.isFinite(Number(reorder_level)) ||
        Number(stock_qty) < 0 ||
        Number(reorder_level) < 0
    ) {
        return res.status(400).send('Please provide valid farm input details.');
    }

    try {
        await pool.query(
            `INSERT INTO farm_inputs
            (input_name, input_type, unit, stock_qty, reorder_level)
            VALUES (?, ?, ?, ?, ?)`,
            [
                input_name.trim(),
                input_type,
                unit.trim(),
                Number(stock_qty),
                Number(reorder_level)
            ]
        );

        res.redirect('/farm-inputs');

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This farm input name already exists.');
        }

        res.status(500).send('Unable to add farm input.');
    }
});

// POST: Update a farm input
router.post('/:id/update', async (req, res) => {
    const { input_name, input_type, unit, stock_qty, reorder_level } = req.body;
    const inputId = Number(req.params.id);

    if (
        !Number.isInteger(inputId) ||
        inputId <= 0 ||
        !input_name?.trim() ||
        !inputTypes.includes(input_type) ||
        !unit?.trim() ||
        !Number.isFinite(Number(stock_qty)) ||
        !Number.isFinite(Number(reorder_level)) ||
        Number(stock_qty) < 0 ||
        Number(reorder_level) < 0
    ) {
        return res.status(400).send('Please provide valid farm input details.');
    }

    try {

const [existing] = await pool.query(
    'SELECT input_id FROM farm_inputs WHERE input_id = ?',
    [inputId]
);

if (existing.length === 0) {
    return res.status(404).send('Farm input not found.');
}

await pool.query(
    `UPDATE farm_inputs
    SET input_name = ?,
        input_type = ?,
        unit = ?,
        stock_qty = ?,
        reorder_level = ?
    WHERE input_id = ?`,
    [
        input_name.trim(),
        input_type,
        unit.trim(),
        Number(stock_qty),
        Number(reorder_level),
        inputId
    ]
);

res.redirect('/farm-inputs');

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This farm input name already exists.');
        }

        res.status(500).send('Unable to update farm input.');
    }
});

// POST: Delete a farm input
router.post('/:id/delete', async (req, res) => {
    const inputId = Number(req.params.id);

    if (!Number.isInteger(inputId) || inputId <= 0) {
        return res.status(400).send('Invalid farm input ID.');
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM farm_inputs WHERE input_id = ?',
            [inputId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Farm input not found.');
        }

        res.redirect('/farm-inputs');

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).send(
                'Cannot delete this input because it is already used in planting records.'
            );
        }

        res.status(500).send('Unable to delete farm input.');
    }
});

module.exports = router;
