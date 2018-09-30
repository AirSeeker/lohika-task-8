const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const reservationsRoutes = require('./app/routes/reservations');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(function (req, res, next) {
    res.type('application/json');
    next();
});
app.use(function (err, req, res, next) {
    console.error(err.stack);
    console.log(e);
    res.status(500).send();
});

app.use('/api', reservationsRoutes);

const server = app.listen(8000, () => {
    console.log('App is running on port 8000');
});

module.exports = server;