
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Display all care tasks
router.get('/', async (req, res) => {
    try {
        const [tasks] = await pool.query(`
            SELECT
                ct.task_id,
                ct.planting_id,
                c.crop_name,
                ct.task_type,
                ct.due_date,
                ct.status,
                ct.source,
                ct.skip_reason,
                ct.assigned_to,
                u.full_name AS assigned_name
            FROM care_tasks ct
            INNER JOIN plantings p
                ON ct.planting_id = p.planting_id
            INNER JOIN crops c
                ON p.crop_id = c.crop_id
            LEFT JOIN users u
                ON ct.assigned_to = u.user_id
            ORDER BY ct.due_date ASC, ct.task_id ASC
        `);

        const [plantings] = await pool.query(`
            SELECT p.planting_id, c.crop_name
            FROM plantings p
            INNER JOIN crops c
                ON p.crop_id = c.crop_id
            WHERE p.status = 'Active'
            ORDER BY p.planting_id
        `);

        const [users] = await pool.query(`
            SELECT user_id, full_name
            FROM users
            WHERE is_active = 1
            ORDER BY full_name
        `);

        res.render('care-tasks', {
            tasks,
            plantings,
            users
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not load care tasks.');
    }
});

// 2. Create a care task
router.post('/', async (req, res) => {
    try {
        const {
            planting_id,
            task_type,
            due_date,
            assigned_to
        } = req.body;

        await pool.query(
            `INSERT INTO care_tasks
                (planting_id, task_type, due_date, status, source, assigned_to)
             VALUES (?, ?, ?, 'Pending', 'Manual', ?)`,
            [
                planting_id,
                task_type,
                due_date,
                assigned_to || null
            ]
        );

        res.redirect('/care-tasks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not create care task.');
    }
});

// 3. Update a care task's status
router.post('/:task_id/status', async (req, res) => {
    try {
        const { task_id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            'Pending',
            'Done',
            'Skipped',
            'Overdue'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).send('Invalid task status.');
        }

        await pool.query(
            'UPDATE care_tasks SET status = ? WHERE task_id = ?',
            [status, task_id]
        );

        res.redirect('/care-tasks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not update care task status.');
    }
});

// 4. Delete a care task
router.post('/:task_id/delete', async (req, res) => {
    try {
        const { task_id } = req.params;

        await pool.query(
            'DELETE FROM care_tasks WHERE task_id = ?',
            [task_id]
        );

        res.redirect('/care-tasks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not delete care task.');
    }
});

module.exports = router;