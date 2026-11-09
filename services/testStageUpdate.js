
const pool = require('../config/db');

async function testStageUpdate() {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Read the real planting, but do not commit any changes.
        const [plantings] = await connection.query(`
            SELECT planting_id, crop_id, current_stage_id, status
            FROM plantings
            WHERE planting_id = 1
            FOR UPDATE
        `);

        if (plantings.length === 0) {
            console.log('Test stopped: planting ID 1 was not found.');
            await connection.rollback();
            return;
        }

        const planting = plantings[0];

        if (planting.status !== 'Active' || planting.crop_id !== 1) {
            console.log('Test stopped: planting ID 1 is not an active Rice planting.');
            await connection.rollback();
            return;
        }

        // Find the Rice stage for simulated day 91.
        const [stages] = await connection.query(`
            SELECT stage_id, stage_name
            FROM crop_growth_stages
            WHERE crop_id = ?
              AND ? BETWEEN start_day AND end_day
            ORDER BY stage_order
            LIMIT 1
        `, [planting.crop_id, 91]);

        if (stages.length === 0) {
            console.log('Test stopped: no matching stage found.');
            await connection.rollback();
            return;
        }

        const nextStage = stages[0];

        // Perform the update only inside this transaction.
        await connection.query(`
            UPDATE plantings
            SET current_stage_id = ?
            WHERE planting_id = ?
              AND status = 'Active'
        `, [nextStage.stage_id, planting.planting_id]);

        const [check] = await connection.query(`
            SELECT current_stage_id
            FROM plantings
            WHERE planting_id = ?
        `, [planting.planting_id]);

        console.log('Original stage ID:', planting.current_stage_id);
        console.log('Simulated stage:', nextStage.stage_name);
        console.log('Temporary stage ID:', check[0].current_stage_id);

        // Undo the temporary update.
        await connection.rollback();
        console.log('PASS: Temporary update rolled back.');
    } catch (error) {
        await connection.rollback();
        console.error('Test failed:', error.message);
    } finally {
        connection.release();
        await pool.end();
    }
}

testStageUpdate();
