
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Show login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Homepage
router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.render('index', { roles: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Login authentication
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query(
            `SELECT users.*, roles.role_name
             FROM users
             JOIN roles ON users.role_id = roles.role_id
             WHERE users.email = ? AND users.is_active = TRUE`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).render('login', {
                error: 'Invalid email or password.'
            });
        }

        const user = users[0];
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).render('login', {
                error: 'Invalid email or password.'
            });
        }

        req.session.user = {
            user_id: user.user_id,
            full_name: user.full_name,
            role_name: user.role_name
        };

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong. Please try again.');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Could not log out.');
        }

        res.redirect('/login');
    });
});

// User management
router.get('/users', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const [users] = await pool.query(`
            SELECT
                users.user_id,
                users.full_name,
                users.email,
                roles.role_name,
                farms.farm_name,
                users.is_active
            FROM users
            INNER JOIN roles
                ON users.role_id = roles.role_id
            LEFT JOIN farms
                ON users.farm_id = farms.farm_id
            ORDER BY users.user_id
        `);

        res.render('users', { users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error while loading users.');
    }
});


// Compatibility redirect
router.get('/user-input', (req, res) => {
    res.redirect('/input-usage');
});

module.exports = router;