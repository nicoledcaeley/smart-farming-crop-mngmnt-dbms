
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

// Plantings
router.get('/plantings', async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const [plantings] = await pool.query(`
            SELECT p.planting_id, f.field_name, c.crop_name,
                   DATE_FORMAT(p.planting_date, '%Y-%m-%d') AS planting_date,
                   DATE_FORMAT(p.expected_harvest_date, '%Y-%m-%d') AS expected_harvest_date,
                   p.status
            FROM plantings p
            JOIN fields f ON p.field_id = f.field_id
            JOIN crops c ON p.crop_id = c.crop_id
        `);

        const [idleFields] = await pool.query(
            "SELECT * FROM fields WHERE status = 'Idle'"
        );
        const [crops] = await pool.query('SELECT * FROM crops');

        res.render('plantings', { plantings, idleFields, crops });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
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
        const [roles] = await pool.query(
           'SELECT role_id, role_name FROM roles'
        );

        const [farms] = await pool.query(
            'SELECT farm_id, farm_name FROM farms'
        );

        res.render('users', { users, roles, farms });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error while loading users.');
    }
});
 // Add new user
router.post('/users', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { full_name, email, password, role_id, farm_id } = req.body;

    // Basic field validation
    if (!full_name || !email || !password || !role_id) {
        return res.status(400).send('Please fill in all required fields.');
    }

    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters.');
    }

    try {
        // Check if email already exists
        const [existingUser] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).send('Email is already registered.');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user
        await pool.query(
            `INSERT INTO users
            (full_name, email, password_hash, role_id, farm_id)
            VALUES (?, ?, ?, ?, ?)`,
            [
                full_name.trim(),
                email.trim(),
                hashedPassword,
                role_id,
                farm_id || null
            ]
        );

        res.redirect('/users');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding user.');
    }
});

// Show edit user page
router.get('/users/edit/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.params.id;

    try {
        const [users] = await pool.query(
            `SELECT user_id, full_name, email, role_id, farm_id, is_active
             FROM users
             WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).send('User not found.');
        }

        const [roles] = await pool.query(
            'SELECT role_id, role_name FROM roles'
        );

        const [farms] = await pool.query(
            'SELECT farm_id, farm_name FROM farms'
        );

        res.render('edit-user', {
            user: users[0],
            roles,
            farms
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading user details.');
    }
});

// Update user information
router.post('/users/edit/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.params.id;
    const { full_name, email, role_id, farm_id, is_active } = req.body;

    // Basic validation
    if (!full_name || !email || !role_id || !['0', '1'].includes(is_active)) {
        return res.status(400).send('Please provide valid user information.');
    }

    if (full_name.trim().length < 2) {
        return res.status(400).send('Full name must have at least 2 characters.');
    }

    try {
        // Check if another user already uses this email
        const [existingUsers] = await pool.query(
            'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
            [email.trim(), userId]
        );

        if (existingUsers.length > 0) {
            return res.status(400).send('Email is already registered.');
        }

        // Update the selected user
        const [result] = await pool.query(
            `UPDATE users
             SET full_name = ?,
                 email = ?,
                 role_id = ?,
                 farm_id = ?,
                 is_active = ?
             WHERE user_id = ?`,
            [
                full_name.trim(),
                email.trim(),
                role_id,
                farm_id || null,
                Number(is_active),
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found.');
        }

        res.redirect('/users');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user.');
    }
});

// Delete user
router.post('/users/delete/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.params.id;

    // Prevent deleting your own account
    if (Number(userId) === Number(req.session.user.user_id)) {
        return res.status(400).send('You cannot delete your own account.');
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM users WHERE user_id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found.');
        }

        res.redirect('/users');

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).send(
                'This user has related records and cannot be deleted. Try deactivating the account instead.'
            );
        }

        res.status(500).send('Error deleting user.');
    }
});

// Users, Roles, and Farms JOIN Report
router.get('/reports/users-roles-farms', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const [report] = await pool.query(`
            SELECT
                users.user_id,
                users.full_name,
                users.email,
                roles.role_name,
                farms.farm_name
            FROM users
            INNER JOIN roles
                ON users.role_id = roles.role_id
            LEFT JOIN farms
                ON users.farm_id = farms.farm_id
            ORDER BY users.user_id
        `);

        res.render('reports/users-roles-farms', { report });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading users report.');
    }
});

// Input usage
router.get('/input-usage', async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const [usageRecords] = await pool.query(`
            SELECT u.usage_id, u.planting_id, i.input_name, u.quantity_used,
                   DATE_FORMAT(u.usage_date, '%Y-%m-%d') AS date_used
            FROM input_usage u
            JOIN farm_inputs i ON u.input_id = i.input_id
        `);

        const [plantings] = await pool.query(`
            SELECT p.planting_id, f.field_name, c.crop_name
            FROM plantings p
            JOIN fields f ON p.field_id = f.field_id
            JOIN crops c ON p.crop_id = c.crop_id
        `);

        const [farmInputs] = await pool.query('SELECT * FROM farm_inputs');

        res.render('input_usage', {
            usageRecords,
            plantings,
            farmInputs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Compatibility redirect
router.get('/user-input', (req, res) => {
    res.redirect('/input-usage');
});

module.exports = router;