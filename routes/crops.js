const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

const validCategories = [
    'Cereal',
    'Vegetable',
    'Fruit',
    'Legume',
    'Root crop'
];

// READ: Display all crops
router.get('/', allowRoles('Admin', 'Farm Manager', 'Farmer', 'Agronomist'), async (req, res) => {
    try {
        const [crops] = await pool.query(
            'SELECT * FROM crops ORDER BY crop_name'
        );

        res.render('crops', {
            crops,
            error: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load crops.');
    }
});

// CREATE: Add a new crop
router.post('/', async (req, res) => {
    const crop_name = req.body.crop_name?.trim();
    const category = req.body.category;
    const days_to_maturity = Number(req.body.days_to_maturity);
    const expected_yield_kg_ha =
        req.body.expected_yield_kg_ha === ''
            ? null
            : Number(req.body.expected_yield_kg_ha);

    try {
        let error = null;

        if (!crop_name || crop_name.length > 80) {
            error = 'Crop name is required and must not exceed 80 characters.';
        } else if (!validCategories.includes(category)) {
            error = 'Please select a valid crop category.';
        } else if (
            !Number.isInteger(days_to_maturity) ||
            days_to_maturity <= 0
        ) {
            error = 'Days to maturity must be a positive whole number.';
        } else if (
            expected_yield_kg_ha !== null &&
            (!Number.isFinite(expected_yield_kg_ha) ||
                expected_yield_kg_ha <= 0)
        ) {
            error = 'Expected yield must be greater than zero.';
        }

        if (error) {
            const [crops] = await pool.query(
                'SELECT * FROM crops ORDER BY crop_name'
            );

            return res.status(400).render('crops', {
                crops,
                error
            });
        }

        await pool.query(
            `INSERT INTO crops
                (crop_name, category, days_to_maturity, expected_yield_kg_ha)
             VALUES (?, ?, ?, ?)`,
            [
                crop_name,
                category,
                days_to_maturity,
                expected_yield_kg_ha
            ]
        );

        res.redirect('/crops');

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_DUP_ENTRY') {
            const [crops] = await pool.query(
                'SELECT * FROM crops ORDER BY crop_name'
            );

            return res.status(400).render('crops', {
                crops,
                error: 'A crop with this name already exists.'
            });
        }

        res.status(500).send('Unable to save crop.');
    }
});

// UPDATE: Edit an existing crop
router.post('/:id/update', async (req, res) => {
    const id = Number(req.params.id);
    const crop_name = req.body.crop_name?.trim();
    const category = req.body.category;
    const days_to_maturity = Number(req.body.days_to_maturity);
    const expected_yield_kg_ha =
        req.body.expected_yield_kg_ha === ''
            ? null
            : Number(req.body.expected_yield_kg_ha);

    try {
        let error = null;

        if (!Number.isInteger(id) || id <= 0) {
            error = 'Invalid crop ID.';
        } else if (!crop_name || crop_name.length > 80) {
            error = 'Crop name is required and must not exceed 80 characters.';
        } else if (!validCategories.includes(category)) {
            error = 'Please select a valid crop category.';
        } else if (
            !Number.isInteger(days_to_maturity) ||
            days_to_maturity <= 0
        ) {
            error = 'Days to maturity must be a positive whole number.';
        } else if (
            expected_yield_kg_ha !== null &&
            (!Number.isFinite(expected_yield_kg_ha) ||
                expected_yield_kg_ha <= 0)
        ) {
            error = 'Expected yield must be greater than zero.';
        }

        if (error) {
            return res.status(400).send(error);
        }

        const [result] = await pool.query(
            `UPDATE crops
             SET crop_name = ?,
                 category = ?,
                 days_to_maturity = ?,
                 expected_yield_kg_ha = ?
             WHERE crop_id = ?`,
            [
                crop_name,
                category,
                days_to_maturity,
                expected_yield_kg_ha,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Crop not found.');
        }

        res.redirect('/crops');

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send(
                'A crop with this name already exists.'
            );
        }

        res.status(500).send('Unable to update crop.');
    }
});

// DELETE: Remove a crop
router.post('/:id/delete', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const [plantings] = await pool.query(
            'SELECT planting_id FROM plantings WHERE crop_id = ? LIMIT 1',
            [id]
        );

        if (plantings.length > 0) {
            const [crops] = await pool.query(
                'SELECT * FROM crops ORDER BY crop_name'
            );

            return res.status(400).render('crops', {
                crops,
                error: 'This crop cannot be deleted because it has existing plantings.'
            });
        }

        await pool.query(
            'DELETE FROM crops WHERE crop_id = ?',
            [id]
        );

        res.redirect('/crops');

    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to delete crop.');
    }
});

module.exports = router;
