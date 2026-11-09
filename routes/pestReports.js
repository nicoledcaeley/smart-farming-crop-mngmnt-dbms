const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT pr.*, p.planting_id, c.crop_name, f.field_name 
            FROM pest_reports pr
            JOIN plantings p ON pr.planting_id = p.planting_id
            JOIN crops c ON p.crop_id = c.crop_id
            JOIN fields f ON p.field_id = f.field_id
            ORDER BY pr.reported_date DESC
        `);
        const [plantings] = await db.query(`
            SELECT p.planting_id, c.crop_name, f.field_name 
            FROM plantings p 
            JOIN crops c ON p.crop_id = c.crop_id 
            JOIN fields f ON p.field_id = f.field_id
        `);
        
        res.render('pest/index', { reports, plantings });
    } catch (error) {
        console.error('Error fetching pest reports:', error);
        res.status(500).send('Database Error');
    }
});

module.exports = router;