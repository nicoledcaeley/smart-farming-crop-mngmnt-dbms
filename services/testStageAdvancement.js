
const pool = require('../config/db');

async function testStageTransition() {
    try {
        const cropId = 1; // Rice
        const simulatedDay = 91;

        const [stages] = await pool.query(`
            SELECT stage_id, stage_name, start_day, end_day
            FROM crop_growth_stages
            WHERE crop_id = ?
              AND ? BETWEEN start_day AND end_day
            ORDER BY stage_order
            LIMIT 1
        `, [cropId, simulatedDay]);

        if (stages.length === 0) {
            console.log('No matching stage found.');
            return;
        }

        const stage = stages[0];

        console.log('Crop: Rice');
        console.log('Simulated day:', simulatedDay);
        console.log('Selected stage:', stage.stage_name);
        console.log('Selected stage ID:', stage.stage_id);

        if (stage.stage_name === 'Ripening' && stage.stage_id === 5) {
            console.log('PASS: Rice advances to Ripening at day 91.');
        } else {
            console.log('FAIL: Unexpected stage selected.');
        }
    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testStageTransition();
