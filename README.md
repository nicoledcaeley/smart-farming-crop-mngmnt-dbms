# Smart Farming and Crop Management System

**DBMS 1 Project**

## Group Members
| No. | Name |
|---|---|
| 1 | Malingin |
| 2 | Pastrana |
| 3 | Quisel |
| 4 | Rebutazo |
| 5 | Rio |
| 6 | Riofrir |

## Section
BB

## Project Description
**Smart Farming and Crop Management System: Precision agriculture, optimal yields, smarter farming**  
The Smart Farming and Crop Management System is an integrated web-based management platform designed to help farm administrators, managers, and agronomists monitor agricultural operations, track crop cycles, analyze environmental sensor data, and manage farm inputs efficiently. The system provides access to user access controls, farm and field spatial configurations, active plantings and harvest logs, growth stage thresholds, automated sensor alerts, weather logs, and comprehensive dashboard reporting.

## Unique Major Feature
Automated environmental threshold monitoring system with auto-created pest/care task generation and audit logging for farm managers.

## Ownership Matrix

| Member | GitHub Username | Tables | Endpoints / Screens | Join Report(s) and Join Type | Feature Role |
|---|---|---|---|---|---|
| Pastrana | nicoledcaeley | roles, farms, users | `/api/users`, `/api/roles`, `/api/farms` / Login Page, User Management | Users with role and farm (INNER JOIN) | Core: Login, Roles |
| Malingin | chrisbrowny05 | crops, fields, farm_inputs | `/api/crops`, `/api/fields`, `/api/farminputs` / Field & Crop Management | Field with no active planting (LEFT JOIN) | Master Data |
| Quisel | Galaxytamer | plantings, harvests, input_usage | `/api/plantings`, `/api/harvests`, `/api/inputusage` / Plantings & Harvest Operations | Plantings with crop, field, and input totals (INNER JOIN) | Transactions |
| Rebutazo | junalynjuly | crop_growth_stages, crop_thresholds, care_tasks | `/api/growthstages`, `/api/thresholds`, `/api/caretasks` / Care Tasks & Growth Stage Monitoring | Current stage per planting (INNER JOIN) | Unique Feature (Rules) |
| Rio | carmelario08 | sensor_readings, alerts, audit_logs | `/api/sensors`, `/api/alerts`, `/api/auditlogs` / Sensor Monitoring, Alerts, Audit Log | Fields vs. weather coverage gaps (FULL OUTER via UNION) | Unique Feature (Workflows/Audits) |
| Riofrir | franklinriofrir16-bot | weather_logs, pest_reports | `/api/weather`, `/api/pestreports`, `/api/dashboard` / Weather Logs, Pest Reports, Main Dashboard | Pest report count per crop (RIGHT JOIN) | Reports and Dashboard |

---

## How to Run Smart Farming and Crop Management System

Follow these steps to set up and run the project on your computer.

### Prerequisites
Make sure the following are installed on your computer:
- Node.js
- Git
- MySQL
- MySQL Workbench
- Visual Studio Code

### Step 1. Create a Project Folder
Create a folder where you want to store the project.  
Open the folder in CMD (Command Prompt) or your terminal.

### Step 2. Clone the Repository
Run the following command:
```bash
git clone [https://github.com/nicoledcaeley/smart-farming-crop-mngmnt-dbms.git](https://github.com/nicoledcaeley/smart-farming-crop-mngmnt-dbms.git) .
```

### Step 3. Install Dependencies
Inside the project directory, run:
```bash
npm install
```
This installs all the required Node.js packages.

### Step 4. Initialize the Database
1. Open **MySQL Workbench** and connect to your local MySQL server.
2. Open and execute the `schema.sql` file located in the project root directory to create the required database and tables.

### Step 5. Open the Project in VS Code
Run:
```bash
code .
```
This opens the project in Visual Studio Code.

### Step 6. Configure the Environment Variables
Locate the `.env.example` file in the project root directory.  
Create a copy of the file and rename the copied file to `.env`.  
Open `.env` and enter your local MySQL credentials.

Example:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_farming_db
```
Replace `your_mysql_password` with your actual MySQL root password. If your MySQL account has no password, leave `DB_PASSWORD` empty.

**Important:** Do not rename or modify `.env.example`. Only edit your personal `.env` file.

### Step 7. Start MySQL
Make sure your local MySQL server is running before starting the backend server.

### Step 8. Start the Backend Server
In VS Code, open the integrated terminal and run:
```bash
npm start
```
Wait for the backend server to start successfully.  
Keep the terminal running while using the application.

### Step 9. Open the Application
Open your preferred web browser (Google Chrome, Microsoft Edge, or Firefox).  
Enter the following address in the browser:
```text
http://localhost:3000/
```
Press **Enter** to access the system login page. Make sure the backend server is still running while accessing the application.

---

## Demo Accounts

The following demo accounts are provided for testing the Smart Farming and Crop Management System.

| Role | Name | Email |
|---|---|---|
| Admin | Carlito Javier | admin@smartfarm.test |
| Farm Manager | Anton Vargas | anton@smartfarm.test |
| Farmer | Louie Macias | louiejay@smartfarm.test |
| Farmer | Rex Malingin | christbrowny@smartfarm.test |
| Agronomist | Kent Yugto | kentboy@smartfarm.test |

**Note:** These accounts are for development and testing purposes only. Login passwords are shared separately with authorized team members. Do not publish passwords or other sensitive credentials in this repository.

---

## Stopping the Application
To stop the backend server, return to the terminal and press:
`Ctrl + C`

## Important Notes
- Each computer must have its own Node.js dependencies and local MySQL server.
- Each user must configure their own `.env` file using their local MySQL credentials.
- The `.env` file is not included in the repository because it contains database credentials.
- Make sure MySQL is running before starting the backend server.
- Keep the backend terminal running while accessing the application.