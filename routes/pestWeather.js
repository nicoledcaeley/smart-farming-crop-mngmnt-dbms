const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 1. DASHBOARD & REPORTS (RIGHT JOIN QUERY)
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    // Required SQL: Pest report count per crop using RIGHT JOIN
    const [pestSummary] = await db.query(`
      SELECT 
        c.crop_id,
        c.crop_name,
        c.category,
        COUNT(pr.pest_id) AS total_pest_reports,
        MAX(pr.reported_date) AS latest_report_date
      FROM pest_reports pr
      RIGHT JOIN plantings p ON pr.planting_id = p.planting_id
      RIGHT JOIN crops c ON p.crop_id = c.crop_id
      GROUP BY c.crop_id, c.crop_name, c.category
      ORDER BY total_pest_reports DESC
    `);

    // Fetch recent weather logs
    const [recentWeather] = await db.query(`
      SELECT wl.*, f.farm_name 
      FROM weather_logs wl
      JOIN farms f ON wl.farm_id = f.farm_id
      ORDER BY wl.log_date DESC LIMIT 5
    `);

    res.render('reports/dashboard', { pestSummary, recentWeather });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Database Error');
  }
});

// ==========================================
// 2. PEST REPORTS CRUD
// ==========================================

// GET: List all pest reports
router.get('/pest-reports', async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT pr.*, p.planting_id, c.crop_name, f.field_name
      FROM pest_reports pr
      JOIN plantings p ON pr.planting_id = p.planting_id
      JOIN crops c ON p.crop_id = c.crop_id
      JOIN fields f ON p.field_id = f.field_id
      ORDER BY pr.report_date DESC
    `);
    const [plantings] = await db.query(`
      SELECT p.planting_id, c.crop_name, f.field_name 
      FROM plantings p
      JOIN crops c ON p.crop_id = c.crop_id
      JOIN fields f ON p.field_id = f.field_id
    `);
    res.render('pest/index', { reports, plantings });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading Pest Reports');
  }
});

// POST: Add pest report
router.post('/pest-reports/add', async (req, res) => {
  const { planting_id, pest_name, severity, report_date, notes } = req.body;
  try {
    await db.query(
      `INSERT INTO pest_reports (planting_id, pest_name, severity, report_date, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [planting_id, pest_name, severity, report_date, notes]
    );
    res.redirect('/pest-reports');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding Pest Report');
  }
});

// POST: Delete pest report
router.post('/pest-reports/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM pest_reports WHERE report_id = ?', [req.params.id]);
    res.redirect('/pest-reports');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting Pest Report');
  }
});

// ==========================================
// 3. WEATHER LOGS CRUD
// ==========================================

// GET: List all weather logs
router.get('/weather-logs', async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT wl.*, f.field_name 
      FROM weather_logs wl
      JOIN fields f ON wl.field_id = f.field_id
      ORDER BY wl.log_date DESC
    `);
    const [fields] = await db.query('SELECT field_id, field_name FROM fields');
    res.render('weather/index', { logs, fields });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading Weather Logs');
  }
});

// POST: Add weather log
router.post('/weather-logs/add', async (req, res) => {
  const { field_id, temperature, humidity, rainfall, log_date } = req.body;
  try {
    await db.query(
      `INSERT INTO weather_logs (field_id, temperature, humidity, rainfall, log_date)
       VALUES (?, ?, ?, ?, ?)`,
      [field_id, temperature, humidity, rainfall, log_date]
    );
    res.redirect('/weather-logs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding Weather Log');
  }
});

// POST: Delete weather log
router.post('/weather-logs/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM weather_logs WHERE log_id = ?', [req.params.id]);
    res.redirect('/weather-logs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting Weather Log');
  }
});

module.exports = router;