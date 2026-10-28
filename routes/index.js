const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.render('index', { roles: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Plantings List with Joins, Crops, and ONLY Idle Fields
router.get('/plantings', async (req, res) => {
    try {
        const [plantings] = await pool.query(`
            SELECT p.*, c.crop_name, f.field_name 
            FROM plantings p
            JOIN crops c ON p.crop_id = c.crop_id
            JOIN fields f ON p.field_id = f.field_id
        `);
        const [crops] = await pool.query('SELECT crop_id, crop_name, days_to_maturity FROM crops');
        
        // Strict Requirement: Dropdown only includes IDLE fields (no active plantings)
        const [idleFields] = await pool.query(`
            SELECT * FROM fields 
            WHERE field_id NOT IN (
                SELECT field_id FROM plantings WHERE status = 'Active'
            )
        `);
        
        res.render('plantings', { plantings, crops, idleFields });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading plantings: ' + err.message);
    }
});

// Add Planting: Transaction + Calculated Expected Harvest Date + Field Status Update
router.post('/plantings/add', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { field_id, crop_id, planted_by, planting_date } = req.body;

        // Calculate expected harvest date in code: planting_date + days_to_maturity
        const [cropRows] = await connection.query('SELECT days_to_maturity FROM crops WHERE crop_id = ?', [crop_id]);
        if (cropRows.length === 0) throw new Error('Crop not found');
        
        const daysToMaturity = cropRows[0].days_to_maturity || 0;
        const pDate = new Date(planting_date);
        pDate.setDate(pDate.getDate() + daysToMaturity);
        const expected_harvest_date = pDate.toISOString().split('T')[0];

        // 1. Insert the planting record
        await connection.query(
            'INSERT INTO plantings (field_id, crop_id, planted_by, planting_date, expected_harvest_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [field_id, crop_id, planted_by, planting_date, expected_harvest_date, 'Active']
        );

        // 2. Update field status to 'Planted' in the SAME transaction
        await connection.query('UPDATE fields SET status = ? WHERE field_id = ?', ['Planted', field_id]);

        await connection.commit();
        connection.release();
        res.redirect('/plantings');
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error(err);
        res.status(500).send('Transaction error: ' + err.message);
    }
});

// Delete Planting: Transaction (Resets field status back to 'Idle')
router.post('/plantings/delete/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [rows] = await connection.query('SELECT field_id, status FROM plantings WHERE planting_id = ?', [id]);
        if (rows.length === 0) throw new Error('Planting record not found');
        
        const { field_id, status } = rows[0];

        // Delete planting record
        await connection.query('DELETE FROM plantings WHERE planting_id = ?', [id]);

        // If it was Active, set the field back to 'Idle'
        if (status === 'Active') {
            await connection.query('UPDATE fields SET status = ? WHERE field_id = ?', ['Idle', field_id]);
        }

        await connection.commit();
        connection.release();
        res.redirect('/plantings');
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error(err);
        res.status(500).send('Error deleting planting: ' + err.message);
    }
});

module.exports = router;
