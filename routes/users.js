var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
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

// employee 가입 성공했을때 리다이렉트 시키는 부분
router.post('/new', passport.authenticate('join-local', {
  successRedirect: '/employee',
  failureRedirect: '/users/new',
  failureFlash: true
}));

// 고객 회원가입
router.get('/new/client', (req, res, next) => {
  res.render('users/client_new');
});
// client 성공했을때 리다이렉트 시키는 부분
router.post('/new/client', passport.authenticate('join-local', {
  successRedirect: '/client',
  failureRedirect: '/users/new/client',
  failureFlash: true
}));

passport.use('join-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
  }, function(req, username, password, done) {
    var name = req.body.name;
    var employee_id = req.body.employee_id == null ? '' : req.body.employee_id;
    var client_id = req.body.client_id == null ? '' : req.body.client_id;
    connection.query('select * from user where username = ?', [username], function (err, rows) {
      if (err) { return done(err); }
      if (rows.length) {
        req.flash('danger','이미 존재하는 아이디입니다');
        res.redirect('back');
      }
      else { 
        if (employee_id != null){ // 직원인 경우
          // 직원 번호 확인
          connection.query('select employee_id from employee where employee_id = ?', employee_id, function(err, result){
            if(err) {return done(err);}
            if (result.length){
              console.log(result,'직원번호 맞음 insert');
              bcrypt.hash(password, null, null, function(err, hash) {
                var sql = {username: username, password: hash, name: name ,employee_id: employee_id}; //, client_id: client_id
                var employee_id = employee_id;
                connection.query('insert into user set ?', sql, function (err, rows) {
                  if (err) throw err;
                  console.log('직원 회원가입 성공!');
                  return done(null, {'employee_id' : rows.employee_id});
                });
              });
            } else{
              console.log('없는 직원번호입니다.');
              return done(null, false, {message: '직원번호가 올바르지 않습니다'});
            }
          });  
        } else if (client_id != null){ //고객인 경우 동작 안함ㅎ..
          console.log('여기까지오나요'); // 
          connection.query('select * from client where client_id = ?', client_id, function(err, result){
            console.log(result,'고객');
            if(err) {return done(err);}
            if (result.length){
              console.log('고객 맞음');
              bcrypt.hash(password, null, null, function(err, hash) {
                var sql = {username: username, password: hash, name: name , client_id: client_id}; //, client_id: client_id
                connection.query('insert into user set ?', sql, function (err, res) {
                  if (err) throw err;
                  console.log('고객회원가입성공!');
                  return done(null, { 'client_id' : rows.client_id });
                });
              });
            }
          });
        } else{ // 모두 null인 경우.
          console.log('직원 번호 또는 고객 번호를 입력하지 않았음');
          req.flash('danger','직원 번호 또는 고객 번호를 입력해주세요.');
          res.redirect('back');
        }
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


