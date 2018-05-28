var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
mysql_dbc.test_open(connection);

passport.serializeUser(function (user, done) {
  done(null, user)
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/');
  }
};

/* GET home page. */
router.get('/', needAuth, function(req, res, next) {
  var query = 'select year(end_date), quarter(end_date), month(end_date), sum(price) '+
  'from project group by '; //group by year(end_date) / group by quarter(end_date) / group by month(end_date)

  if (req.user.roles.includes("management")) {
    //년도별
    connection.query(query+'year(end_date)', function(err, year){
      if (err) throw(err);
      // 분기별
      connection.query(query+'quarter(end_date)', function(err, quarter){
        if (err) throw(err);
        connection.query(query+'month(end_date)', function(err, month){
          if (err) throw(err);
          res.render('/management/mg',{
            user: req.user,
            year: year,
            quarter: quarter,
            month: month
          })
        })
      });
    });
  } else {
    res.redirect('/project');
  }
});

module.exports = router;