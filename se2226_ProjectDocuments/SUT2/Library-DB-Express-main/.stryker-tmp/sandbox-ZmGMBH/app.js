// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//require sequelize
const {
  sequelize
} = require('./models/index.js');
var indexRouter = require('./routes/index');

//require error handlers
const errorHandlers = require('./errorHandlers');
var app = express();

//async IIFE
(async () => {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    await sequelize.sync();
    try {
      if (stryMutAct_9fa48("1")) {
        {}
      } else {
        stryCov_9fa48("1");
        await sequelize.authenticate();
        console.log(stryMutAct_9fa48("2") ? "" : (stryCov_9fa48("2"), "Connection to DB Worked!"));
      }
    } catch (error) {
      if (stryMutAct_9fa48("3")) {
        {}
      } else {
        stryCov_9fa48("3");
        console.log(stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), "Connection to DB Failed..."), error);
      }
    }
  }
})();
// view engine setup
app.set(stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), 'views'), path.join(__dirname, stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), 'views')));
app.set(stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), 'view engine'), stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), 'pug'));
app.use(logger(stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'dev')));
app.use(express.json());
app.use(express.urlencoded(stryMutAct_9fa48("10") ? {} : (stryCov_9fa48("10"), {
  extended: stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11"), false)
})));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), 'public'))));
app.use(stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), '/'), indexRouter);

// Error Handlers
app.use(errorHandlers.fourOhFour);
app.use(errorHandlers.globalError);
module.exports = app;