USE smart_farming;

SELECT
    p.planting_id,
    c.crop_name,
    p.planting_date,
    p.expected_harvest_date,
    s.stage_name AS current_stage,
    s.stage_order,
    p.status
FROM plantings p
INNER JOIN crops c
    ON p.crop_id = c.crop_id
INNER JOIN crop_growth_stages s
    ON p.current_stage_id = s.stage_id;