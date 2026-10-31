require('dotenv').config();
const express = require('express');
const session = require('express-session');

const advanceStages = require('./services/stageAdvancement');

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

// Automatically update growth stages
async function runStageAdvancement() {
    try {
        await advanceStages();
        console.log('Growth stages checked successfully.');
    } catch (error) {
        console.error('Growth stage advancement failed:', error);
    }
}

// Run when the server starts
runStageAdvancement();

// Repeat every 24 hours
setInterval(runStageAdvancement, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
