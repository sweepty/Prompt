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
  console.log(req.user.user.role, 'management 유저info');
  if (req.user.user.role == "management") {
    console.log("managment임")
    connection.query('select * from employee e join department d on e.department_id = d.department_id',function(err, rows){
      if (err) throw(err);
      console.log(rows);
      connection.query('select e.employee_id, e.name, p.name, w.start_date '+
      'from	works_on w right outer join employee e on w.employee_id=e.employee_id '+
      'right outer join project p on p.project_id=w.project_id where e.employee_id is not null', function(err, result){
        if (err) throw(err)
        res.render('project/emp_info', {
          user: req.user,
          employees: rows,
          p_employees: result,
          all: 0 // 변경 해야...
        });
      })
    });
  } else{
      res.render('project/emp_info', {
          
      })
  }
});

module.exports = router;