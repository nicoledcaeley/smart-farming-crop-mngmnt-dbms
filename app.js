
require('dotenv').config();
const express = require('express');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use('/', require('./routes/index'));
app.use('/growth-stages', require('./routes/growth-stages')); 
app.use('/thresholds', require('./routes/thresholds'));
app.use('/care-tasks', require('./routes/care-tasks'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});