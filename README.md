# Smart Farming and Crop Management System (DBMS 1)


## Group members



Malingin, Pastrana, Quisel, Rebutazo, Rio, Riofrir

## Ownership matrix

| Member | GitHub username | Tables | Endpoints / screens | Join report(s) and join type | Feature role |
|---|---|---|---|---|---|
| A Pastrana | nicoledcaeley | roles, farms, users | Users CRUD, login | Users with role and farm (INNER JOIN) | Core: login, roles |
| B Malingin | chrisbrowny05 | crops, fields, farm_inputs | Fields CRUD screen, Crops screen, Farm inputs screen | Field with no active planting (LEFT JOIN) | Master Data |
| C Quisel | Galaxytamer | plantings, harvests, input_usage | Plantings CRUD screen, harvest and input usage entry | Plantings with crop, field and input totals (INNER JOIN) | Transactions |
| D Rebutazo | junalynjuly | crop_growth_stages, crop_thresholds, care_tasks | Care Tasks CRUD screen, Growth Stages screen, Thresholds screen | Current stage per planting (INNER JOIN) | Unique Feature Rules; stage advancement, harvest prediction |
| E Rio | carmelario08 | sensor_readings, alerts, audit_logs | Alerts CRUD screen, sensor readings entry, audit log view | Fields vs weather coverage gaps (FULL OUTER via UNION of LEFT and RIGHT) | Threshold alerts, auto-created tasks, audit |
| F Riofrir | franklinriofrir16-bot | weather_logs, pest_reports | Pest_report CRUD screen, weather_logs entry, Dashboard | Pest report count per crop (RIGHT JOIN) | Reports and Dashboard |

## Tech Stack
Express with EJS pages

- Database: MySQL 8.0.16
- Backend: Node.js + Express with EJS pages
- DB driver: mysql2



## How to run



1. Run `schema.sql` in MySQL Workbench.

2. Copy `.env.example` to `.env` and fill in your own values.

3. Run `npm install`, then `npm start`.




