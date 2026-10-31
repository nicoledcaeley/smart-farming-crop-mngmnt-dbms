
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// READ: Display fields and their farm names
router.get('/', async (req, res) => {
    try {
        const [fields] = await pool.query(`
            SELECT fields.*, farms.farm_name
            FROM fields
            JOIN farms ON fields.farm_id = farms.farm_id
            ORDER BY fields.field_id
        `);

        const [farms] = await pool.query(
            'SELECT farm_id, farm_name FROM farms'
        );

        res.render('fields', {
            fields,
            farms,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load fields.');
    }
});

// CREATE: Add a new field
router.post('/', async (req, res) => {
    const farm_id = Number(req.body.farm_id);
    const field_name = req.body.field_name?.trim();
    const area_ha = Number(req.body.area_ha);
    const soil_type = req.body.soil_type;
    const status = req.body.status;

    const validSoils = ['Clay', 'Loam', 'Sandy', 'Sandy loam', 'Silt'];
    const validStatuses = ['Idle', 'Planted', 'Fallow'];

    try {
        const [farms] = await pool.query(
            'SELECT farm_id, farm_name FROM farms'
        );

        const [farm] = await pool.query(
            'SELECT farm_id FROM farms WHERE farm_id = ?',
            [farm_id]
        );

        let error = null;

        if (!Number.isInteger(farm_id) || !farm.length) {
            error = 'Please select a valid farm.';
        } else if (!field_name || field_name.length > 80) {
            error = 'Field name is required and must be at most 80 characters.';
        } else if (
            !req.body.area_ha ||
            !Number.isFinite(area_ha) ||
            area_ha <= 0 ||
            area_ha > 999999.99 ||
            !/^\d+(\.\d{1,2})?$/.test(req.body.area_ha)
        ) {
            error = 'Area must be positive and have no more than 2 decimal places.';
        } else if (!validSoils.includes(soil_type)) {
            error = 'Please select a valid soil type.';
        } else if (!validStatuses.includes(status)) {
            error = 'Please select a valid field status.';
        }

        if (error) {
            const [fields] = await pool.query(`
                SELECT fields.*, farms.farm_name
                FROM fields
                JOIN farms ON fields.farm_id = farms.farm_id
                ORDER BY fields.field_id
            `);

            return res.status(400).render('fields', {
                fields,
                farms,
                error
            });
        }

        await pool.query(
            `INSERT INTO fields
             (farm_id, field_name, area_ha, soil_type, status)
             VALUES (?, ?, ?, ?, ?)`,
            [farm_id, field_name, area_ha, soil_type, status]
        );

        res.redirect('/fields');
    } catch (err) {
        console.error(err);

        if (err.code === 'ER_DUP_ENTRY') {
            try {
                const [fields] = await pool.query(`
                    SELECT fields.*, farms.farm_name
                    FROM fields
                    JOIN farms ON fields.farm_id = farms.farm_id
                    ORDER BY fields.field_id
                `);

                const [farms] = await pool.query(
                    'SELECT farm_id, farm_name FROM farms'
                );

                return res.status(400).render('fields', {
                    fields,
                    farms,
                    error: 'A field with this name already exists for the selected farm.'
                });
            } catch (loadErr) {
                console.error(loadErr);
                return res.status(500).send('Unable to reload fields.');
            }
        }

        res.status(500).send('Unable to save field.');
    }
});

// UPDATE: Edit an existing field
router.post('/:id/update', async (req, res) => {
    const { farm_id, field_name, area_ha, soil_type, status } = req.body;
    const { id } = req.params;

    try {
        await pool.query(
            `UPDATE fields
             SET farm_id = ?, field_name = ?, area_ha = ?,
                 soil_type = ?, status = ?
             WHERE field_id = ?`,
            [farm_id, field_name, area_ha, soil_type, status, id]
        );

        res.redirect('/fields');
} catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.redirect(
            '/fields?error=' +
            encodeURIComponent('A field with this name already exists for the selected farm.')
        );
    }

    res.status(500).send('Unable to update field.');
}
});

// DELETE: Remove an existing field
router.post('/:id/delete', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if the field has existing planting records
        const [plantings] = await pool.query(
            'SELECT planting_id FROM plantings WHERE field_id = ? LIMIT 1',
            [id]
        );

        // Prevent deletion if planting records exist
        if (plantings.length > 0) {
            return res.redirect(
                '/fields?error=' +
                encodeURIComponent('Cannot delete this field because it has existing planting records.')
            );
        }

        // Delete field if no planting records exist
        await pool.query(
            'DELETE FROM fields WHERE field_id = ?',
            [id]
        );

        res.redirect('/fields');

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.redirect(
                '/fields?error=' +
                encodeURIComponent('Cannot delete this field because other records are still linked to it.')
            );
        }

        res.status(500).send('Unable to delete field.');
    }
});

module.exports = router;
