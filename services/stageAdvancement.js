
const pool = require('../config/db');

async function advanceStages() {
    const [plantings] = await pool.query(`
        SELECT
            planting_id,
            crop_id,
            planting_date,
            current_stage_id,
            DATEDIFF(CURDATE(), planting_date) AS days_since_planting
        FROM plantings
        WHERE status = 'Active'
    `);

    for (const planting of plantings) {
        const [stages] = await pool.query(`
            SELECT stage_id, stage_name
            FROM crop_growth_stages
            WHERE crop_id = ?
              AND start_day <= ?
              AND end_day >= ?
            ORDER BY stage_order
            LIMIT 1
        `, [
            planting.crop_id,
            planting.days_since_planting,
            planting.days_since_planting
        ]);

        if (stages.length === 0) {
            console.log(
                `No matching stage found for planting ${planting.planting_id}.`
            );
            continue;
        }

        const correctStage = stages[0];

        if (correctStage.stage_id !== planting.current_stage_id) {
            await pool.query(`
                UPDATE plantings
                SET current_stage_id = ?
                WHERE planting_id = ?
                  AND status = 'Active'
            `, [
                correctStage.stage_id,
                planting.planting_id
            ]);

            console.log(
                `Planting ${planting.planting_id}: advanced to ${correctStage.stage_name}.`
            );
        } else {
            console.log(
                `Planting ${planting.planting_id}: already in ${correctStage.stage_name}.`
            );
        }
    }
}

module.exports = advanceStages;
