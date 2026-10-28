\# Smart Farming and Crop Management System (DBMS 1)



\## Group members



Malingin, Pastrana, Quisel, Rebutazo, Rio, Riofrir



\## Ownership matrix



| Member | GitHub username | Tables | Endpoints / screens | Join report(s) and join type | Feature role |

|---|---|---|---|---|---|

| A Pastrana | nicoledcaeley | roles, farms, users | Users CRUD, login | Users with role and farm (INNER) | Core: login, roles |

| B Malingin | | crops, fields, farm\_inputs | | | |

| C Quisel | Galaxytamer | plantings, harvests, input_usage |Plantings CRUD screen, harvest and input usage entry |Plantings with crop, field and input totals (INNER) |Transactions |

| D Rebutazo | | crop\_growth\_stages, crop\_thresholds, care\_tasks | | | |

| E Rio | | sensor\_readings, alerts, audit\_logs | | | |

| F Riofrir | franklinriofrir16-bot| pest_reports, weather_logs, Dashboard| Pest_report CRUD screen, weather_logs entry, Dashboard | Pest report count per crop (RIGHT JOIN) | Reports and Dashboard| 



\## Tech stack



\- Database: MySQL 8.0.16

\- Backend: Node.js + Express with EJS pages

\- DB driver: mysql2



\## How to run



1\. Run `schema.sql` in MySQL Workbench.

2\. Copy `.env.example` to `.env` and fill in your own values.

3\. Run `npm install`, then `npm start`.

