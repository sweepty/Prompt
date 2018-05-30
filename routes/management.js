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
  var query_project = 'select count(*) counter from (select distinct e.name, w.employee_id, count(*) '+
  'from works_on w join employee e on w.employee_id=e.employee_id '+
  'where w.start_date < now() and w.end_date is null group by w.employee_id ';
  var query_none = 'select count(*) counter from (select p.works_on_id wk from employee e left join '+
  '(select * from works_on w where start_date < now() and end_date is null) p '+
  'on e.employee_id=p.employee_id '+
  'group by e.employee_id) pp where pp.wk is null;';
  if (req.user.roles.includes("management")) {
    //년도별
    connection.query(query+'years', function(err, year){
      if (err) throw(err);
      // 분기별
      connection.query(query+'quarters', function(err, quarter){
        if (err) throw(err);
        //월별
        connection.query(query+'months', function(err, month){
          //0개
          connection.query(query_none,function(err, none){
            if (err) throw(err);
            //1개
            connection.query(query_project+'having count(w.employee_id) = 1) p;',function(err, one){
              if (err) throw(err);
              //2개
              connection.query(query_project+'having count(w.employee_id) = 2) p;',function(err, two){
                if (err) throw(err);
                connection.query(query_project+'having count(w.employee_id) >= 3) p;',function(err, upthree){
                  if (err) throw(err);
                  console.log(year,'0빵개')
                  console.log(quarter,'1개ㅐㅐㅐㅐㅐ')
                  console.log(month,'달별')
                  var price = [];
                  for(i=0;i<month.length;i++){
                    price.push(month[i].prices);
                  }
                  console.log(price,'3이상')
                  res.render('admin_main',{
                    user: req.user,
                    year: year,
                    quarter: quarter,
                    month: month,
                    price: price[0],
                    none: none[0],
                    one: one[0],
                    two: two[0],
                    upthree: upthree[0],
                  })
                });
              });
            });
          });
        })
      });
    });
  } else {
    res.redirect('/project');
  }
});

module.exports = router;