const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

// Display all farms
router.get('/', allowRoles('Admin', 'Farm Manager', 'Farmer', 'Agronomist'), async (req, res) => {

    try {
        const [farms] = await pool.query(
            'SELECT * FROM farms ORDER BY farm_id'
        );

        res.render('farms', { farms });
    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load farms.');
    }
});

// Add a new farm
router.post('/', allowRoles('Admin', 'Farm Manager', 'Farmer', 'Agronomist'), async (req, res) => {

    const { farm_name, location, total_area_ha } = req.body;

    if (!farm_name?.trim() || !location?.trim() || total_area_ha === '') {
        return res.status(400).send('Please complete all required fields.');
    }

    const area = Number(total_area_ha);

    if (!Number.isFinite(area) || area <= 0) {
        return res.status(400).send('Total area must be greater than zero.');
    }

    try {
        await pool.query(
            `INSERT INTO farms (farm_name, location, total_area_ha)
             VALUES (?, ?, ?)`,
            [farm_name.trim(), location.trim(), area]
        );

        res.redirect('/farms');
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This farm name already exists.');
        }

        res.status(500).send('Unable to add farm.');
    }
});

// Display edit form
router.get('/:id/edit', allowRoles('Admin', 'Farm Manager'), async (req, res) => {
    try {
        const [farms] = await pool.query(
            'SELECT * FROM farms WHERE farm_id = ?',
            [req.params.id]
        );

        if (farms.length === 0) {
            return res.status(404).send('Farm not found.');
        }

        res.render('edit-farm', { farm: farms[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load farm.');
    }
});

// Update farm
router.post('/:id/edit', allowRoles('Admin', 'Farm Manager'), async (req, res) => {

    const { farm_name, location, total_area_ha } = req.body;

    if (!farm_name?.trim() || !location?.trim() || total_area_ha === '') {
        return res.status(400).send('Please complete all required fields.');
    }

    const area = Number(total_area_ha);

    if (!Number.isFinite(area) || area <= 0) {
        return res.status(400).send('Total area must be greater than zero.');
    }

    try {
        const [result] = await pool.query(
            `UPDATE farms
             SET farm_name = ?, location = ?, total_area_ha = ?
             WHERE farm_id = ?`,
            [farm_name.trim(), location.trim(), area, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Farm not found.');
        }

        res.redirect('/farms');
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This farm name already exists.');
        }

        res.status(500).send('Unable to update farm.');
    }
});

module.exports = router;
