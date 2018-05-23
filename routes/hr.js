var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

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

//------------직원 추가----------
router.get('/new', function(req, res, next){
  connection.query('select * from department', function(err, rows){
    res.render('hr/emp_new.pug',{
      user: req.user,
      departments: rows
    });
  })
});

router.post('/new', function(req, res, next){
  var name = req.body.name;
  var RRNumber = req.body.RRNumber;
  var education = req.body.education;
  var department = req.body.department;
  var email = req.body.email;
  var data = {name: name, RRNumber: RRNumber, education: education, department: department, email: email};
  connection.query('insert into user set ?',data, function(err, rows){
    if (err) throw(err);
    res.render('project/emp_info', {
      user: req.user,
    })
  })
});
module.exports = router;