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
const createError = require('http-errors');

//404 handler
const fourOhFour = (req, res, next) => {
  if (stryMutAct_9fa48("14")) {
    {}
  } else {
    stryCov_9fa48("14");
    const err = new Error();
    err.status = 404;
    err.message = stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), "A 404 Error Occured!  The webpage could not be found!");
    next(err);
  }
};

//Global Error Handler
const globalError = (err, req, res, next) => {
  if (stryMutAct_9fa48("16")) {
    {}
  } else {
    stryCov_9fa48("16");
    if (stryMutAct_9fa48("19") ? err.status !== 404 : stryMutAct_9fa48("18") ? false : stryMutAct_9fa48("17") ? true : (stryCov_9fa48("17", "18", "19"), err.status === 404)) {
      if (stryMutAct_9fa48("20")) {
        {}
      } else {
        stryCov_9fa48("20");
        res.render(stryMutAct_9fa48("21") ? "" : (stryCov_9fa48("21"), 'page-not-found'), stryMutAct_9fa48("22") ? {} : (stryCov_9fa48("22"), {
          err,
          title: stryMutAct_9fa48("23") ? "" : (stryCov_9fa48("23"), "404.  Page Not Found")
        }));
      }
    } else {
      if (stryMutAct_9fa48("24")) {
        {}
      } else {
        stryCov_9fa48("24");
        err.status = stryMutAct_9fa48("27") ? err.status && 500 : stryMutAct_9fa48("26") ? false : stryMutAct_9fa48("25") ? true : (stryCov_9fa48("25", "26", "27"), err.status || 500);
        err.message = stryMutAct_9fa48("30") ? `A Server Error Occured! ${err.message}` && "A Server Error Occurred!" : stryMutAct_9fa48("29") ? false : stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28", "29", "30"), (stryMutAct_9fa48("31") ? `` : (stryCov_9fa48("31"), `A Server Error Occured! ${err.message}`)) || (stryMutAct_9fa48("32") ? "" : (stryCov_9fa48("32"), "A Server Error Occurred!")));
        console.log(stryMutAct_9fa48("33") ? `` : (stryCov_9fa48("33"), `Error Status: ${err.status}`), stryMutAct_9fa48("34") ? `` : (stryCov_9fa48("34"), `Error Message: ${err.message}`));
        res.render(stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'error'), stryMutAct_9fa48("36") ? {} : (stryCov_9fa48("36"), {
          err
        }));
        return err;
      }
    }
  }
};
module.exports = stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
  fourOhFour,
  globalError
});