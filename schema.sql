DROP DATABASE IF EXISTS smart_farming;
CREATE DATABASE smart_farming CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_farming;

-- =====================================================================
-- A. CORE
-- =====================================================================

CREATE TABLE roles (
    role_id       INT AUTO_INCREMENT PRIMARY KEY,
    role_name     VARCHAR(50)  NOT NULL UNIQUE,
    description   VARCHAR(255) NULL
);

CREATE TABLE farms (
    farm_id       INT AUTO_INCREMENT PRIMARY KEY,
    farm_name     VARCHAR(100) NOT NULL UNIQUE,
    location      VARCHAR(150) NOT NULL,
    total_area_ha DECIMAL(8,2) NOT NULL CHECK (total_area_ha > 0),
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    role_id       INT          NOT NULL,
    farm_id       INT          NULL,                 -- NULL = not tied to one farm (e.g. admin)
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,             -- store a HASH, never a plain password
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_users_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id)
);

-- =====================================================================
-- B. MASTER DATA
-- =====================================================================

CREATE TABLE crops (
    crop_id                INT AUTO_INCREMENT PRIMARY KEY,
    crop_name              VARCHAR(80) NOT NULL UNIQUE,
    category               ENUM('Cereal','Vegetable','Fruit','Legume','Root crop') NOT NULL,
    days_to_maturity       INT         NOT NULL CHECK (days_to_maturity > 0),
    expected_yield_kg_ha   DECIMAL(10,2) NULL CHECK (expected_yield_kg_ha IS NULL OR expected_yield_kg_ha > 0)
);

CREATE TABLE fields (
    field_id      INT AUTO_INCREMENT PRIMARY KEY,
    farm_id       INT          NOT NULL,
    field_name    VARCHAR(80)  NOT NULL,
    area_ha       DECIMAL(8,2) NOT NULL CHECK (area_ha > 0),
    soil_type     ENUM('Clay','Loam','Sandy','Sandy loam','Silt') NOT NULL,
    status        ENUM('Idle','Planted','Fallow') NOT NULL DEFAULT 'Idle',
    CONSTRAINT uq_field_per_farm UNIQUE (farm_id, field_name),
    CONSTRAINT fk_fields_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id)
);

CREATE TABLE farm_inputs (
    input_id       INT AUTO_INCREMENT PRIMARY KEY,
    input_name     VARCHAR(100) NOT NULL UNIQUE,
    input_type     ENUM('Seed','Fertilizer','Pesticide','Other') NOT NULL,
    unit           VARCHAR(20)  NOT NULL,            -- kg, L, sack, ...
    stock_qty      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    reorder_level  DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0)
);

-- =====================================================================
-- D (part 1). Rule tables. Created before plantings because
-- plantings.current_stage_id points to crop_growth_stages.
-- =====================================================================

CREATE TABLE crop_growth_stages (
    stage_id      INT AUTO_INCREMENT PRIMARY KEY,
    crop_id       INT         NOT NULL,
    stage_name    VARCHAR(60) NOT NULL,
    stage_order   INT         NOT NULL CHECK (stage_order > 0),
    start_day     INT         NOT NULL CHECK (start_day >= 0),   -- days after planting
    end_day       INT         NOT NULL,
    CONSTRAINT chk_stage_days CHECK (end_day >= start_day),
    CONSTRAINT uq_stage_order UNIQUE (crop_id, stage_order),
    CONSTRAINT fk_stage_crop FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);

CREATE TABLE crop_thresholds (
    threshold_id  INT AUTO_INCREMENT PRIMARY KEY,
    crop_id       INT NOT NULL,
    metric        ENUM('soil_moisture','temperature','ph') NOT NULL,
    min_value     DECIMAL(6,2) NOT NULL,
    max_value     DECIMAL(6,2) NOT NULL,
    CONSTRAINT chk_threshold_range CHECK (max_value >= min_value),
    CONSTRAINT uq_threshold UNIQUE (crop_id, metric),
    CONSTRAINT fk_threshold_crop FOREIGN KEY (crop_id) REFERENCES crops(crop_id) ON DELETE CASCADE
);

-- =====================================================================
-- C. TRANSACTIONS
-- =====================================================================

CREATE TABLE plantings (
    planting_id           INT AUTO_INCREMENT PRIMARY KEY,
    field_id              INT  NOT NULL,
    crop_id               INT  NOT NULL,
    planted_by            INT  NOT NULL,
    planting_date         DATE NOT NULL,
    expected_harvest_date DATE NULL,                  -- auto-calculated: planting_date + days_to_maturity
    current_stage_id      INT  NULL,                  -- auto-updated by the stage rule
    status                ENUM('Active','Harvested','Failed') NOT NULL DEFAULT 'Active',
    CONSTRAINT chk_harvest_after_planting CHECK (expected_harvest_date IS NULL OR expected_harvest_date >= planting_date),
    CONSTRAINT fk_planting_field FOREIGN KEY (field_id) REFERENCES fields(field_id),
    CONSTRAINT fk_planting_crop  FOREIGN KEY (crop_id)  REFERENCES crops(crop_id),
    CONSTRAINT fk_planting_user  FOREIGN KEY (planted_by) REFERENCES users(user_id),
    CONSTRAINT fk_planting_stage FOREIGN KEY (current_stage_id) REFERENCES crop_growth_stages(stage_id)
);

CREATE TABLE harvests (
    harvest_id    INT AUTO_INCREMENT PRIMARY KEY,
    planting_id   INT  NOT NULL,
    harvest_date  DATE NOT NULL,
    quantity_kg   DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
    quality_grade ENUM('A','B','C') NOT NULL,
    recorded_by   INT  NOT NULL,
    CONSTRAINT fk_harvest_planting FOREIGN KEY (planting_id) REFERENCES plantings(planting_id),
    CONSTRAINT fk_harvest_user     FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);

CREATE TABLE input_usage (
    usage_id       INT AUTO_INCREMENT PRIMARY KEY,
    planting_id    INT  NOT NULL,
    input_id       INT  NOT NULL,
    quantity_used  DECIMAL(10,2) NOT NULL CHECK (quantity_used > 0),
    usage_date     DATE NOT NULL,
    used_by        INT  NOT NULL,
    CONSTRAINT fk_usage_planting FOREIGN KEY (planting_id) REFERENCES plantings(planting_id),
    CONSTRAINT fk_usage_input    FOREIGN KEY (input_id)    REFERENCES farm_inputs(input_id),
    CONSTRAINT fk_usage_user     FOREIGN KEY (used_by)     REFERENCES users(user_id)
);

-- =====================================================================
-- D (part 2). Care tasks
-- =====================================================================

CREATE TABLE care_tasks (
    task_id      INT AUTO_INCREMENT PRIMARY KEY,
    planting_id  INT  NOT NULL,
    task_type    ENUM('Irrigation','Fertilizing','Pest control','Weeding','Other') NOT NULL,
    due_date     DATE NOT NULL,
    status       ENUM('Pending','Done','Skipped','Overdue') NOT NULL DEFAULT 'Pending',
    source       ENUM('Manual','Auto') NOT NULL DEFAULT 'Manual',   -- Auto = created by the engine
    skip_reason  VARCHAR(255) NULL,                                 -- filled when status = 'Skipped'
    assigned_to  INT  NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_planting FOREIGN KEY (planting_id) REFERENCES plantings(planting_id),
    CONSTRAINT fk_task_user     FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

-- =====================================================================
-- E. WORKFLOW, ALERTS, AUDIT
-- =====================================================================

CREATE TABLE sensor_readings (
    reading_id    INT AUTO_INCREMENT PRIMARY KEY,
    field_id      INT NOT NULL,
    metric        ENUM('soil_moisture','temperature','ph') NOT NULL,
    value         DECIMAL(6,2) NOT NULL,
    reading_time  DATETIME NOT NULL,
    CONSTRAINT fk_reading_field FOREIGN KEY (field_id) REFERENCES fields(field_id)
);

CREATE TABLE alerts (
    alert_id      INT AUTO_INCREMENT PRIMARY KEY,
    field_id      INT NOT NULL,
    reading_id    INT NULL,
    threshold_id  INT NULL,
    task_id       INT NULL,                                          -- care task the alert generated (if any)
    severity      ENUM('Low','Medium','High') NOT NULL,
    message       VARCHAR(255) NOT NULL,
    status        ENUM('Open','Acknowledged','Resolved') NOT NULL DEFAULT 'Open',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_field     FOREIGN KEY (field_id)     REFERENCES fields(field_id),
    CONSTRAINT fk_alert_reading   FOREIGN KEY (reading_id)   REFERENCES sensor_readings(reading_id),
    CONSTRAINT fk_alert_threshold FOREIGN KEY (threshold_id) REFERENCES crop_thresholds(threshold_id),
    CONSTRAINT fk_alert_task      FOREIGN KEY (task_id)      REFERENCES care_tasks(task_id)
);

CREATE TABLE audit_logs (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NULL,                                            -- NULL = done by the system itself
    action      VARCHAR(50)  NOT NULL,                               -- INSERT, UPDATE, DELETE, AUTO_STAGE, ...
    table_name  VARCHAR(60)  NOT NULL,
    record_id   INT          NULL,
    details     VARCHAR(255) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================================
-- F. REPORTS
-- =====================================================================

CREATE TABLE weather_logs (
    weather_id    INT AUTO_INCREMENT PRIMARY KEY,
    farm_id       INT  NOT NULL,
    log_date      DATE NOT NULL,
    rainfall_mm   DECIMAL(6,2) NOT NULL DEFAULT 0 CHECK (rainfall_mm >= 0),
    temperature_c DECIMAL(4,1) NULL,
    humidity_pct  DECIMAL(5,2) NULL CHECK (humidity_pct IS NULL OR (humidity_pct BETWEEN 0 AND 100)),
    CONSTRAINT uq_weather_day UNIQUE (farm_id, log_date),
    CONSTRAINT fk_weather_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id)
);

CREATE TABLE pest_reports (
    pest_id        INT AUTO_INCREMENT PRIMARY KEY,
    planting_id    INT  NOT NULL,
    reported_by    INT  NOT NULL,
    pest_name      VARCHAR(100) NOT NULL,
    severity       ENUM('Low','Medium','High') NOT NULL,
    reported_date  DATE NOT NULL,
    action_taken   VARCHAR(255) NULL,
    status         ENUM('Open','Treated','Resolved') NOT NULL DEFAULT 'Open',
    CONSTRAINT fk_pest_planting FOREIGN KEY (planting_id) REFERENCES plantings(planting_id),
    CONSTRAINT fk_pest_user     FOREIGN KEY (reported_by) REFERENCES users(user_id)
);

INSERT INTO roles (role_name, description) VALUES
 ('Admin',        'Full system access'),                  -- 1
 ('Farm Manager', 'Manages fields, plantings and tasks'), -- 2
 ('Farmer',       'Records daily farm activity'),         -- 3
 ('Agronomist',   'Reviews crop health and thresholds');  -- 4

INSERT INTO farms (farm_name, location, total_area_ha) VALUES
 ('Sunrise Farm',   'Bacolod City, Negros Occidental', 7.00),   -- 1
 ('Hacienda Verde', 'Silay City, Negros Occidental',   5.50);   -- 2

INSERT INTO users (role_id, farm_id, full_name, email, password_hash) VALUES
(1, NULL, 'Carlito Javier', 'admin@smartfarm.test', 'HASH_PLACEHOLDER'),
(2, 1, 'Anton Vargas', 'anton@smartfarm.test', 'HASH_PLACEHOLDER'),
(3, 1, 'Louie Macias', 'louiejay@smartfarm.test', 'HASH_PLACEHOLDER'),
(3, 2, 'Rex Malingin', 'christbrowny@smartfarm.test', 'HASH_PLACEHOLDER'),
(4, NULL, 'Kent Yugto', 'kentboy@smartfarm.test', 'HASH_PLACEHOLDER');

INSERT INTO crops (crop_name, category, days_to_maturity, expected_yield_kg_ha) VALUES
 ('Rice',       'Cereal',    110,  4500),    -- 1
 ('Corn',       'Cereal',     95,  5000),    -- 2
 ('Tomato',     'Vegetable',  75, 20000),    -- 3
 ('Eggplant',   'Vegetable',  80, 15000),    -- 4  (no stages yet: shows up in LEFT JOIN report)
 ('Mung Bean',  'Legume',     65,  1000);    -- 5  (no stages yet)

INSERT INTO fields (farm_id, field_name, area_ha, soil_type, status) VALUES
 (1, 'Field A',     3.50, 'Loam',       'Planted'),  -- 1
 (1, 'Field B',     2.00, 'Clay',       'Planted'),  -- 2
 (1, 'Field C',     1.50, 'Sandy loam', 'Idle'),     -- 3  (idle: appears in LEFT JOIN report)
 (2, 'North Plot',  2.50, 'Loam',       'Planted'),  -- 4
 (2, 'South Plot',  1.80, 'Silt',       'Idle'),     -- 5  (idle)
 (2, 'East Plot',   1.20, 'Sandy',      'Idle');     -- 6  (harvested, now idle)

INSERT INTO farm_inputs (input_name, input_type, unit, stock_qty, reorder_level) VALUES
 ('Rice Seed (Certified)', 'Seed',       'kg',   200, 50),   -- 1
 ('Corn Seed (Hybrid)',    'Seed',       'kg',   120, 30),   -- 2
 ('Tomato Seed',           'Seed',       'kg',    15,  5),   -- 3
 ('Urea 46-0-0',           'Fertilizer', 'sack',  40, 10),   -- 4
 ('Complete 14-14-14',     'Fertilizer', 'sack',  25, 10),   -- 5
 ('Organic Pest Spray',    'Pesticide',  'L',     30,  8);   -- 6

-- Growth stages (days after planting). Rice 1-5, Corn 6-9, Tomato 10-13.
INSERT INTO crop_growth_stages (crop_id, stage_name, stage_order, start_day, end_day) VALUES
 (1, 'Germination',   1,  0,  10),   -- 1
 (1, 'Seedling',      2, 11,  30),   -- 2
 (1, 'Vegetative',    3, 31,  60),   -- 3
 (1, 'Reproductive',  4, 61,  90),   -- 4
 (1, 'Ripening',      5, 91, 110),   -- 5
 (2, 'Germination',   1,  0,   7),   -- 6
 (2, 'Vegetative',    2,  8,  50),   -- 7
 (2, 'Tasseling',     3, 51,  70),   -- 8
 (2, 'Grain Filling', 4, 71,  95),   -- 9
 (3, 'Seedling',      1,  0,  20),   -- 10
 (3, 'Vegetative',    2, 21,  40),   -- 11
 (3, 'Flowering',     3, 41,  55),   -- 12
 (3, 'Fruiting',      4, 56,  75);   -- 13

-- Soil moisture in %, temperature in Celsius.
INSERT INTO crop_thresholds (crop_id, metric, min_value, max_value) VALUES
 (1, 'soil_moisture', 60, 90),   -- 1 rice
 (2, 'soil_moisture', 40, 70),   -- 2 corn
 (3, 'soil_moisture', 50, 75),   -- 3 tomato
 (3, 'temperature',   18, 32);   -- 4 tomato

-- Dates are based on today = 2026-10-28.
INSERT INTO plantings (field_id, crop_id, planted_by, planting_date, expected_harvest_date, current_stage_id, status) VALUES
 (1, 1, 3, '2026-08-20', '2026-12-08', 4,  'Active'),      -- 1 rice, day 69 -> Reproductive
 (2, 2, 3, '2026-09-10', '2026-12-14', 7,  'Active'),      -- 2 corn, day 48 -> Vegetative
 (4, 3, 4, '2026-10-01', '2026-12-15', 11, 'Active'),      -- 3 tomato, day 27 -> Vegetative
 (6, 2, 4, '2026-06-01', '2026-09-04', 9,  'Harvested');   -- 4 corn, finished

INSERT INTO harvests (planting_id, harvest_date, quantity_kg, quality_grade, recorded_by) VALUES
 (4, '2026-09-04', 6000.00, 'A', 4);

INSERT INTO input_usage (planting_id, input_id, quantity_used, usage_date, used_by) VALUES
 (1, 1, 70.00, '2026-08-20', 3),
 (1, 4,  8.00, '2026-09-25', 3),
 (2, 2, 40.00, '2026-09-10', 3),
 (2, 5,  5.00, '2026-10-05', 3),
 (3, 3,  2.50, '2026-10-01', 4),
 (4, 2, 18.00, '2026-06-01', 4);

-- Edge case demo: task 1 was skipped automatically because it rained.
INSERT INTO care_tasks (planting_id, task_type, due_date, status, source, skip_reason, assigned_to) VALUES
 (1, 'Irrigation',  '2026-10-27', 'Skipped', 'Auto',   'Rainfall of 22.5 mm logged within the last 24 hours', 3),  -- 1
 (2, 'Irrigation',  '2026-10-28', 'Pending', 'Auto',   NULL, 3),                                                   -- 2
 (3, 'Fertilizing', '2026-10-30', 'Pending', 'Manual', NULL, 4),                                                   -- 3
 (1, 'Weeding',     '2026-10-20', 'Done',    'Manual', NULL, 3);                                                   -- 4

INSERT INTO sensor_readings (field_id, metric, value, reading_time) VALUES
 (1, 'soil_moisture', 48.0, '2026-10-27 06:00:00'),   -- 1 below rice min (60) but it rained
 (2, 'soil_moisture', 31.0, '2026-10-27 06:15:00'),   -- 2 below corn min (40), no rain -> task
 (4, 'soil_moisture', 62.0, '2026-10-27 06:30:00'),   -- 3 OK
 (4, 'temperature',   34.0, '2026-10-27 13:00:00'),   -- 4 above tomato max (32) -> alert
 (4, 'soil_moisture', 58.0, '2026-10-28 05:00:00');   -- 5 OK, farm 2 has no weather log for 10-28

INSERT INTO alerts (field_id, reading_id, threshold_id, task_id, severity, message, status) VALUES
 (1, 1, 1, 1,    'Low',    'Soil moisture 48% below rice minimum (60%). Irrigation skipped: rain in last 24h.', 'Resolved'),
 (2, 2, 2, 2,    'High',   'Soil moisture 31% below corn minimum (40%). Irrigation task created.',               'Open'),
 (4, 4, 4, NULL, 'Medium', 'Temperature 34 C above tomato maximum (32 C).',                                      'Open');

INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES
 (2,    'INSERT',     'plantings',  1, 'Rice planting created in Field A'),
 (NULL, 'AUTO_STAGE', 'plantings',  1, 'Stage advanced to Reproductive (day 61)'),
 (NULL, 'AUTO_TASK',  'care_tasks', 2, 'Irrigation task created from low soil moisture alert'),
 (NULL, 'AUTO_SKIP',  'care_tasks', 1, 'Irrigation skipped: rainfall 22.5 mm in last 24h');

INSERT INTO weather_logs (farm_id, log_date, rainfall_mm, temperature_c, humidity_pct) VALUES
 (1, '2026-10-26', 22.50, 27.5, 88.0),
 (1, '2026-10-27',  1.00, 29.0, 75.0),
 (2, '2026-10-24',  5.00, 28.0, 80.0),    -- weather but no sensor readings that day
 (2, '2026-10-27',  0.00, 31.5, 68.0);

INSERT INTO pest_reports (planting_id, reported_by, pest_name, severity, reported_date, action_taken, status) VALUES
 (1, 3, 'Rice black bug', 'Medium', '2026-10-10', 'Applied organic pest spray', 'Treated'),
 (2, 3, 'Fall armyworm',  'High',   '2026-10-22', NULL,                         'Open'),
 (3, 4, 'Aphids',         'Low',    '2026-10-25', 'Monitoring',                 'Open');
-- planting 4 (harvested corn) has no pest report on purpose.

-- =====================================================================
-- VIEW used by the FULL OUTER JOIN report (sensor activity per farm per day)
-- =====================================================================

CREATE VIEW v_sensor_days AS
SELECT f.farm_id, DATE(sr.reading_time) AS day, COUNT(*) AS readings
FROM sensor_readings sr
INNER JOIN fields f ON f.field_id = sr.field_id
GROUP BY f.farm_id, DATE(sr.reading_time);

-- =====================================================================
-- SAMPLE JOIN REPORTS. Run them one at a time to check the data.
-- Remove the comment markers to try a query. Adapt them into your own code.
-- =====================================================================

/*
-- A (INNER): users with their role and farm
SELECT u.full_name, r.role_name, fm.farm_name
FROM users u
INNER JOIN roles r  ON r.role_id = u.role_id
LEFT  JOIN farms fm ON fm.farm_id = u.farm_id;   -- admin/agronomist have no farm

-- B (LEFT): fields with no active planting
SELECT f.field_name, f.status
FROM fields f
LEFT JOIN plantings p ON p.field_id = f.field_id AND p.status = 'Active'
WHERE p.planting_id IS NULL;

-- C (INNER): plantings with crop, field and total inputs used
SELECT p.planting_id, c.crop_name, f.field_name, p.planting_date,
       COALESCE(SUM(iu.quantity_used), 0) AS total_input_used
FROM plantings p
INNER JOIN crops  c ON c.crop_id  = p.crop_id
INNER JOIN fields f ON f.field_id = p.field_id
LEFT  JOIN input_usage iu ON iu.planting_id = p.planting_id
GROUP BY p.planting_id, c.crop_name, f.field_name, p.planting_date;

-- D (LEFT): crops that still have no growth stages defined
SELECT c.crop_name
FROM crops c
LEFT JOIN crop_growth_stages s ON s.crop_id = c.crop_id
WHERE s.stage_id IS NULL;

-- D (INNER): current stage and days since planting for each active planting
SELECT p.planting_id, c.crop_name, s.stage_name,
       DATEDIFF('2026-10-28', p.planting_date) AS days_since_planting,
       p.expected_harvest_date
FROM plantings p
INNER JOIN crops c ON c.crop_id = p.crop_id
INNER JOIN crop_growth_stages s ON s.stage_id = p.current_stage_id
WHERE p.status = 'Active';

-- E (FULL OUTER via UNION of LEFT and RIGHT; MySQL has no FULL OUTER JOIN):
-- days with sensor readings vs days with weather logs, per farm
SELECT s.farm_id, s.day AS day_value, s.readings, w.rainfall_mm
FROM v_sensor_days s
LEFT JOIN weather_logs w ON w.farm_id = s.farm_id AND w.log_date = s.day
UNION
SELECT w.farm_id, w.log_date, s.readings, w.rainfall_mm
FROM v_sensor_days s
RIGHT JOIN weather_logs w ON w.farm_id = s.farm_id AND w.log_date = s.day;

-- F (RIGHT): pest report count per crop, including plantings with no pests
SELECT c.crop_name,
       COUNT(DISTINCT p.planting_id) AS plantings,
       COUNT(pr.pest_id)             AS pest_reports
FROM pest_reports pr
RIGHT JOIN plantings p ON p.planting_id = pr.planting_id
INNER JOIN crops c     ON c.crop_id = p.crop_id
GROUP BY c.crop_id, c.crop_name;
*/
