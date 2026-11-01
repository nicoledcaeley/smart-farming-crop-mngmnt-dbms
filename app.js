require('dotenv').config();
const express = require('express');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));
app.use('/', require('./routes/index'));
app.use('/growth-stages', require('./routes/growth-stages')); 
app.use('/thresholds', require('./routes/thresholds'));
app.use('/care-tasks', require('./routes/care-tasks'));
app.use('/fields', require('./routes/fields'));
app.use('/crops', require('./routes/crops'));
app.use('/readings', require('./routes/readings'));
app.use('/alerts', require('./routes/alerts'));
app.use('/farm-inputs', require('./routes/farm-inputs')); 
app.use('/reports/idle-fields', require('./routes/idle-fields')); 
app.use('/reports/current-stage', require('./routes/current-stage'));

app.use('/', require('./routes/pestWeather'));
app.use('/', require('./routes/plantings'));
app.use('/', require('./routes/harvests'));
app.use('/', require('./routes/input_usage'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
