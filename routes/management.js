var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
var d3 = require("d3");
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
  var query = 'select year(end_date) years , quarter(end_date) quarters , month(end_date) months, sum(price) prices '+
  'from project group by ';

  if (req.user.roles.includes("management")) {
    //년도별
    connection.query(query+'years', function(err, year){
      if (err) throw(err);
      // 분기별
      connection.query(query+'quarters', function(err, quarter){
        if (err) throw(err);
        //월별 콜백헬 극혐
        connection.query(query+'months', function(err, month){
          if (err) throw(err);
          console.log(year,'연도')
          console.log(quarter,'분기별')
          console.log(month,'월별')
          // var dataArray = [23, 13, 21, 14, 37, 15, 18, 34, 30];
          // var svg = d3.select("body").append("svg")
          //   .attr("height","100%")
          //   .attr("width","100%");        
          res.render('management/mg',{
            
            user: req.user,
            year: year,
            quarter: quarter,
            month: month,
            
          })
        })
      });
    });
  } else {
    res.redirect('/project');
  }
});

module.exports = router;