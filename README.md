# Smart Farming and Crop Management System
**DBMS 1 Project**

## Group Roster
- Malingin
- Pastrana
- Quisel
- Rebutazo
- Rio
- Riofrir

## Ownership Matrix

| Member | GitHub Username | Tables | Endpoints / Screens | Join Report(s) and Join Type | Feature Role |
|---|---|---|---|---|---|
| A. Pastrana | nicoledcaeley | roles, farms, users | Users CRUD, Login | Users with role and farm (INNER JOIN) | Core: Login, Roles |
| B. Malingin | chrisbrowny05 | crops, fields, farm_inputs | Fields, Crops, Farm Inputs | Field with no active planting (LEFT JOIN) | Master Data |
| C. Quisel | Galaxytamer | plantings, harvests, input_usage | Plantings CRUD, Harvest and Input Usage | Plantings with crop, field, and input totals (INNER JOIN) | Transactions |
| D. Rebutazo | junalynjuly | crop_growth_stages, crop_thresholds, care_tasks | Care Tasks, Growth Stages, Thresholds | Current stage per planting (INNER JOIN) | Unique Feature Rules |
| E. Rio | carmelario08 | sensor_readings, alerts, audit_logs | Alerts, Sensor Readings, Audit Log | Fields vs. weather coverage gaps (FULL OUTER via UNION) | Threshold Alerts, Auto-created Tasks, Audit |
| F. Riofrir | franklinriofrir16-bot | weather_logs, pest_reports | Pest Reports, Weather Logs, Dashboard | Pest report count per crop (RIGHT JOIN) | Reports and Dashboard |

## How to Run the Project

1. Open the project folder in VS Code.
2. Run `schema.sql` in MySQL Workbench.
3. Configure your `.env` file using `.env.example`.
4. Open the terminal and run:

   ```bash
   npm install
   npm start
   ```

5. Open the local URL shown in the terminal.