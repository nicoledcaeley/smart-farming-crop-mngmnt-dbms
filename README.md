\# Smart Farming and Crop Management System (DBMS 1)



\## Group members



Malingin, Pastrana, Quisel, Rebutazo, Rio, Riofrir


## Ownership matrix



| Member | GitHub username | Tables | Endpoints / screens | Join report(s) and join type | Feature role |

|---|---|---|---|---|---|
| A Pastrana | nicoledcaeley | roles, farms, users | Users CRUD, login | Users with role and farm (INNER) | Core: login, roles |
| B Malingin | chrisbrowny05 | crops, fields, farm_inputs | Fields CRUD screen, Crop screen, Farm inputs screen | Field with no active planting (LEFT JOIN) | Master Data |
| C Quisel | Galaxytamer | plantings, harvests, input_usage |Plantings CRUD screen, harvest and input usage entry |Plantings with crop, field and input totals (INNER) |Transactions |
| D Rebutazo | junalynjuly | crop_growth_stages, crop_thresholds, care_tasks | Care Tasks CRUD screen, Growth Stages screen, Thresholds screen | Current stage per planting (INNER JOIN) | Unique FeatureRules; Stage advancement, Harvest prediction |
| E Rio | | sensor\_readings, alerts, audit\_logs | | | |
| F Riofrir | franklinriofrir16-bot | weather_logs, pest_reports | Pest_report CRUD screen, weather_logs entry, Dashboard | Pest report count per crop (RIGHT JOIN) | Reports and Dashboard |



\## Tech stack



\- Database: MySQL 8.0.16

\- Backend: Node.js + Express with EJS pages

\- DB driver: mysql2



\## How to run



1\. Run `schema.sql` in MySQL Workbench.

2\. Copy `.env.example` to `.env` and fill in your own values.

3\. Run `npm install`, then `npm start`.

