const { allowRoles } = require('../middleware/permissions');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', allowRoles('Admin','Farm Manager','Farmer'), async (req,res,next)=>{
 try{
   const [rows] = await db.query(`
     SELECT r.*, f.field_name 
     FROM sensor_readings r 
     LEFT JOIN fields f ON r.field_id = f.field_id 
     ORDER BY r.reading_time DESC
   `);
   const [fields] = await db.query(`SELECT field_id, field_name FROM fields ORDER BY field_name`);
   res.render('readings', { readings: rows, fields: fields });
 } catch(err){
   console.error('READINGS GET ERROR:', err);
   res.status(500).send('<h1>REAL READINGS ERROR:</h1><pre>' + err.message + '</pre>');
 }
});

router.post('/', allowRoles('Admin','Farm Manager','Farmer'), async (req,res,next)=>{
 try{
   const { field_id, metric, value } = req.body;
   await db.query(`INSERT INTO sensor_readings (field_id, metric, value, reading_time) VALUES (?,?,?,NOW())`, [field_id, metric, value]);
   res.redirect('/readings');
 } catch(err){
   console.error('READINGS POST ERROR:', err);
   res.status(500).send(err.message);
 }
});

module.exports = router;
