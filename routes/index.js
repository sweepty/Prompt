var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

mysql_dbc.test_open(connection);

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/project')
  } else {
    res.render('index', { title: 'Prompt Solution' });
  }
});

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

router.post('/', function(req, res, next) {
  console.log('login-local');
  passport.authenticate('login-local', function(err, user, info) {
    if (err) {
      res.status(500).json(err); // 500 : Server Error
    }
    if (!user) {
      res.redirect('/');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.session.user = user;
      res.redirect('/project');
    });
  }) (req, res, next);
});

//로그아웃
router.get('/signout', (req, res) => {
  req.logout();
  res.clearCookie('dbpdbpteeeaaamm22');
  res.redirect('/');
});

passport.use('login-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true //인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
}, function (req, username, password, done) {
  connection.query('select * from user where username = ?', [username], function (err, result) {
    if (err) {
      console.log('err :' + err);
      return done(false, null);
    }
    else {
      if (result === null) {
        console.log('존재하지 않는 아이디입니다.');
        return done(false, null);
      } else {
        if (!bcrypt.compareSync(password, result[0].password)) {
          console.log('패스워드가 일치하지 않습니다');
          return done(false, null);
        }
        else {
          console.log('로그인 성공^*^');

          //직원인지 고객인지 판별
          connection.query('select * from user where username = ?', [username], function(err, rows){
            if (err) {
              console.log('error:', err);
              return done(null, false, req.flash('loginMessage', '사용자를 찾을 수 없습니다.'));
            };
            //고객.
            user = rows[0]
            if (user.client_id != null){
              console.log('고객입니다');
              console.log(user,'고객정보 확인');
              return done(null, {
                username: user.username,
                user_id: user.user_id,
                client_id: user.client_id,
                roles: 'client'
              });

            } else{ //직원
              console.log('직원입니다.');
              console.log(user,'직원정보 확인');
              return done(null, {
                username: user.username,
                user_id: user.user_id,
                employee_id: user.employee_id,
                roles: 'employee'
              });
            }
          });
        }
      }
    }
  })
}));

module.exports = router;
