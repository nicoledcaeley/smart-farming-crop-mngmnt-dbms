\# Smart Farming and Crop Management System (DBMS 1)



\## Group members



Malingin, Pastrana, Quisel, Rebutazo, Rio, Riofrir



\## Ownership matrix



| Member | GitHub username | Tables | Endpoints / screens | Join report(s) and join type | Feature role |

|---|---|---|---|---|---|

| A Pastrana | nicoledcaeley | roles, farms, users | Users CRUD, login | Users with role and farm (INNER) | Core: login, roles |

| B Malingin | | crops, fields, farm\_inputs | | | |

| C Quisel | | plantings, harvests, input\_usage | | | |

| D Rebutazo | | crop\_growth\_stages, crop\_thresholds, care\_tasks | | | |

| E Rio | | sensor\_readings, alerts, audit\_logs | | | |

| F Riofrir | | weather\_logs, pest\_reports | | | |



\## Tech stack



\- Database: MySQL 8.0.16

\- Backend: Node.js + Express with EJS pages

\- DB driver: mysql2



\## How to run



1\. Run `schema.sql` in MySQL Workbench.

2\. Copy `.env.example` to `.env` and fill in your own values.

3\. Run `npm install`, then `npm start`.

