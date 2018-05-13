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
  res.render('index', { title: 'Prompt Solution' });
});

// router.post('/signin', function(req, res, next) {
//   var username = "hello";
//   var password = "1234";

//   password = passport.bcrypt.make(password);

//   connection.query("INSERT (username, password) INTO users VALUE (?, ?)", username, password,)
// });

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

router.post('/', passport.authenticate('local', {
  failureRedirect: 'back', 
  failureFlash: true
  }), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
  function (req, res) {
    res.redirect('/employee'); 
});
router.get('/login', function(req, res, next) {
  res.render('/employee', { title: 'Prompt Solution' });
});

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true //인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
}, function (req, username, password, done) {
  connection.query('select * from user where username = ?', [username], function (err, result) {
    if (err) {
      console.log('err :' + err);
      return done(false, null);
    } else {
      if (result === null) {
        console.log('존재하지 않는 아이디입니다.');
        return done(false, null);
      } else {
        if (!bcrypt.compareSync(password, result[0].password)) {
          console.log('패스워드가 일치하지 않습니다');
          return done(false, null);
        } else {
          console.log('로그인 성공^*^');
          req.flash('success','로그인 성공!');
          connection.query('select * from user where username = ?', [username], function(err, res, result){
            if (err) {
              console.log('error:', err);
              return done(null, false, req.flash('loginMessage', '사용자를 찾을 수 없습니다.'));
            }
            //고객.
            if (result === null){
              console.log('고객입니다');
              // req.redirect('/client');
            } else{ //직원(경영진, 일반직원)
              console.log('직원입니다.'); //직원 중에서도 경영진이랑 일반직원으로 나눠야함.>>>추후에.
              // req.flash('success','직원환영'); //여기 넘어가는게 안됨;-;
              // res.redirect('/');
            }
            return done(null, {user: username});
          })
        }
      }
    }
  })
}));

module.exports = router;
