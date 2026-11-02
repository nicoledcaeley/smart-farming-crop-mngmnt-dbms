
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { allowRoles } = require('../middleware/permissions');

// Display all roles
router.get('/', allowRoles('Admin'), async (req, res) => {
      try {
        const [roles] = await pool.query(
            'SELECT * FROM roles ORDER BY role_id'
        );

        res.render('roles', { roles });
    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load roles.');
    }
});

// Add a new role
router.post('/', allowRoles('Admin'), async (req, res) => {
   const { role_name, description } = req.body;

    if (!role_name || !role_name.trim()) {
        return res.status(400).send('Role name is required.');
    }

    try {
        await pool.query(
            'INSERT INTO roles (role_name, description) VALUES (?, ?)',
            [role_name.trim(), description || null]
        );

        res.redirect('/roles');
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This role already exists.');
        }

        res.status(500).send('Unable to add role.');
    }
});

// Display edit form
router.get('/:id/edit', allowRoles('Admin'), async (req, res) => {
    try {
        const [roles] = await pool.query(
            'SELECT * FROM roles WHERE role_id = ?',
            [req.params.id]
        );

        if (roles.length === 0) {
            return res.status(404).send('Role not found.');
        }

        res.render('edit-role', { role: roles[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to load role.');
    }
});

// Update role
router.post('/:id/edit', allowRoles('Admin'), async (req, res) => {
    const { role_name, description } = req.body;

    if (!role_name || !role_name.trim()) {
        return res.status(400).send('Role name is required.');
    }

    try {
        const [result] = await pool.query(
            `UPDATE roles
             SET role_name = ?, description = ?
             WHERE role_id = ?`,
            [role_name.trim(), description || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Role not found.');
        }

        res.redirect('/roles');
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('This role already exists.');
        }

        res.status(500).send('Unable to update role.');
    }
});

module.exports = router;
