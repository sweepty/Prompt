var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
// var bodyParser = require('body-parser');
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
mysql_dbc.test_open(connection);

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/');
  }
}

passport.serializeUser(function(user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function(user_id, done) {
  done(null, user_id);
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/new', (req, res, next) => {
  res.render('users/new');
});

// 성공했을때 리다이렉트 시키는 부분
router.post('/new', passport.authenticate('join-local', {
  successRedirect: '/employee',
  failureRedirect: '/users/new',
  failureFlash: true
}));

passport.use('join-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
  }, function(req, username, password, done) {
    var name = req.body.name;
    var employee_id = req.body.employee_id == null ? "" : req.body.employee_id;
    var client_id = req.body.client_id == null ? "" : req.body.client_id;
    connection.query('select * from user where username = ?', [username], function (err, rows) {
      if (err) { return done(err); }
      if (rows.length) {
        req.flash('danger','이미 존재하는 아이디입니다');
        res.redirect('back');
      }
      else {
        bcrypt.hash(password, null, null, function(err, hash) {
          var sql = {username: username, password: hash, name: name ,employee_id: employee_id}; //, client_id: client_id
          connection.query('insert into user set ?', sql, function (err, rows) {
            if (err) throw err;
            console.log('회원가입성공!')
            return done(null, {'username' : username});
          });
        });
      }
    })
  }
));

//상세정보
// router.get('/myinfo', isAuthenticated, function (req, res) {
//   res.render('myinfo',{
//     title: 'My Info',
//     user_info: req.user
//   })
// });

module.exports = router;


