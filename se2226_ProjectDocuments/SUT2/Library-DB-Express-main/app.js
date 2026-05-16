var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//require sequelize
const { sequelize } = require('./models/index.js');

var indexRouter = require('./routes/index');

//require error handlers
const errorHandlers = require('./errorHandlers');

var app = express();

//async IIFE
(async () => {
  await sequelize.sync();
  try {
    await sequelize.authenticate();
    console.log("Connection to DB Worked!");
  } catch (error){
    console.log("Connection to DB Failed...", error);
  }
})();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Error Handlers
app.use(errorHandlers.fourOhFour);
app.use(errorHandlers.globalError);

module.exports = app;
