var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'), 
  LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

mysql_dbc.test_open(connection);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('employee/home', { 
    title: 'weeellcomme',
    user: req.params.result
  });
});
router.get('/evaluation', function(req, res, next) {
  connection.query('select * from works_on w inner join employee e where w.employee_id = e.employee_id = ?',[employee_id], function(err, result){
    
  });
  res.render('employee/evaluation', {projects: projects });
})

passport.serializeUser(function (user, done) {
  done(null, user)
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
};


module.exports = router;
