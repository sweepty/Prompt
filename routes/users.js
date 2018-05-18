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

function validateForm(form, options) {
  var username = form.username || "";
  var employee_id = form.employee_id || "";
  var client_id = form.client_id || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return '이름을 입력해주세요.';
  }

  if (!employee_id) {
    return '직원번호를 입력해주세요.';
  }
  if (!client_id) {
    return '고객번호를 입력해주세요.';
  }

  if (!form.password && options.needPassword) {
    return '비밀번호를 입력해주세요.';
  }

  if (form.password !== form.password_confirmation) {
    return '비밀번호가 일치하지 않습니다.';
  }

  if (form.password.length < 4) {
    return '비밀번호는 4자 이상이어야 합니다.';
  }

  return null;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// --------------- 직원 회원 가입 -----------------
router.get('/new', (req, res, next) => {
  res.render('users/new');
});
// employee 가입 성공했을때 리다이렉트 시키는 부분
router.post('/new', passport.authenticate('join-local', {
  successRedirect: '/project',
  failureRedirect: '/users/new',
  failureFlash: true
}));

// --------------- 고객 회원 가입 -----------------
router.get('/new/client', (req, res, next) => {
  res.render('users/client_new');
});
// client 성공했을때 리다이렉트 시키는 부분
router.post('/new/client', passport.authenticate('join-local', {
  successRedirect: '/project',
  failureRedirect: '/users/new/client',
  failureFlash: true
}));

// --------------- 개인 정보 상세 ------------------
// 조회
router.get('/myinfo', needAuth, function (req, res) {
  const sql = 'select username, name from user where user_id= ?';
  connection.query(sql, req.user.user_id, function(err, rows){
    if (err) {throw(err)};
    res.render('users/myinfo',{
      info : rows[0],
      title: '개인정보'
    });
  })
});

//수정
router.put('/myinfo', needAuth, function(req, res){
  const sql = 'select * from user username = ?';
  const sql2 = 'update user set ? where user_id = ?';
  //아이디 중복확인...
  connection.query(sql, req.body.username, function(err, rows){
    if (err) throw(err);
    if (rows.length === 0){
      console.log('중복되는 아이디는 아님ㅇㅇ');
      //암호화
      bcrypt.hash(req.body.password, null, null, function(err, hash) {
        const values = {
          username: req.body.username, 
          password: hash,
          name: req.body.name
        }
        connection.query(sql2, values, req.user.user_id, function(err, rows){
          if (err) throw(err);
          console.log('정보 업데이트 성공~');
          var user = rows[0];
          res.render('/myinfo', {
            username: user.username,
            user_id: user.user_id
          });
        });
      });
    } else {
      console.log('아이디 중복!!')
      res.render('back', {message:'이미 존재하는 아이디입니다'});
    }
  });
});

passport.use('join-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
  }, function(req, username, password, done) {
    var name = req.body.name;
    var employee_id = req.body.employee_id;
    var client_id = req.body.client_id;
    connection.query('select * from user where username = ?', [username], function (err, rows) {
      if (err) { return done(err); }
      if (rows.length) {
        req.flash('danger','이미 존재하는 아이디입니다');
        return done(null, false, {message: '이미 존재하는 아이디입니다.'});
      }
      else {
        if (employee_id != null){ // 직원인 경우
          // 직원 번호 확인
          connection.query('select * from employee where employee_id = ?', [employee_id], function(err, result){
            if(err) {return done(err);}
            if (result.length){
              console.log(result,'이미 가입되어있는지 확인');
              connection.query('select * from user where employee_id = ?',[employee_id], function(err, result){
                if(err) {return done(err);}

                if (result.length == 0){ // 처음가입하는 직원임
                  bcrypt.hash(password, null, null, function(err, hash) {
                    console.log(employee_id,'직원번호');
                    var sql = {username: username, password: hash, name: name , employee_id: employee_id};
    
                    connection.query('insert into user set ?', sql, function (err, rows) {
                      if (err) throw err;
                      console.log('직원 회원가입 성공!');
                      var user = rows[0];
                      console.log(user.employee_id,'테스트용!!!');
                      return done(null, {
                        username: user.username,
                        employee_id: user.employee_id,
                        role: 'employee'
                      });
                    });
                  });
                } else{ //이미 가입된 직원
                  console.log('이미 가입되어있습니다.')
                  return done(null, false, {message: '이미 가입되어있습니다.'});
                }
              });
            } else{ //틀린 직원번호 넣었을 때 
              console.log('직원번호 틀림');
              return done(null, false, {message: '직원번호가 틀렸습니다.'});
            }
          });  
        } else {
          //직원번호 확인
          connection.query('select * from client where client_id = ?', [client_id], function(err, result){
            console.log(result,'고객');
            if(err) {return done(err);}
            if (result.length){
              console.log('고객 맞음');
              connection.query('select * from user where client_id = ?',[client_id], function(err, result){
                if(err) {throw(err)};
                //처음 가입하는 고객
                if (result.length == 0){
                  bcrypt.hash(password, null, null, function(err, hash) {
                    var sql = {username: username, password: hash, name: name , client_id: client_id};
                    connection.query('insert into user set ?', sql, function (err, rows) {
                      if (err) throw err;
                      console.log('고객회원가입성공!');
                      var user = rows[0];
                      return done(null, {
                        username: user.username,
                        client_id: user.client_id,
                        role: 'client'
                      });
                    });
                  });
                } else{
                  console.log('이미 가입되어있습니다.')
                  return done(null, false, {message: '이미 가입되어있습니다.'});
                }
              });
            } else{
              console.log('고객번호 틀림');
              return done(null, false, {message: '고객번호가 틀렸습니다.'});
            }
          });
        }
      }
    })
  }
));

module.exports = router;