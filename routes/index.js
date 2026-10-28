
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

module.exports = router;
