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
  var query_project = 'select count(*) counter from project p ';
  if (req.user.roles.includes("management")) {
    //년도별
    connection.query(query+'years', function(err, year){
      if (err) throw(err);
      // 분기별
      connection.query(query+'quarters', function(err, quarter){
        if (err) throw(err);
        //월별 콜백헬 극혐이지만 ㅎ...살려줏ㄷ
        connection.query(query+'months', function(err, month){
          //시작전
          connection.query(query_project+'where p.start_date > now()',function(err, notyet){
            if (err) throw(err);
            //진행중
            connection.query(query_project+'where p.start_date < now() and p.end_date > now()',function(err, ing){
              if (err) throw(err);
              //완료
              connection.query(query_project+'where p.end_date < now()',function(err, done){
                if (err) throw(err);
                connection.query(query_project,function(err, all){
                  if (err) throw(err);
                  console.log(year,'연도')
                  console.log(quarter,'분기별')
                  console.log(month,'월별')
                  var price = [];
                  for(i=0;i<month.length;i++){
                    price.push(month[i].prices);
                  }
                  console.log(price,'아직ㅎㅎ');
                  res.render('admin_main',{
                    user: req.user,
                    year: year,
                    quarter: quarter,
                    month: month,
                    price: price,
                    notyet: notyet[0],
                    ing: ing[0],
                    done: done[0],
                    all: all[0],
                    arr: [1,2,3,4]
                  })
                  // res.send('success', {
                  //   user: req.user,
                  //   year: year,
                  //   quarter: quarter,
                  //   month: month,
                  //   price: price,
                  //   notyet: notyet[0],
                  //   ing: ing[0],
                  //   done: done[0],
                  //   all: all[0],
                  // })
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