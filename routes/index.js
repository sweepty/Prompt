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
  res.redirect('/login');
};

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login', 
  failureFlash: true
}), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
  function (req, res) {
    res.redirect('/home'); 
  });

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true //인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
}, function (req, username, password, done) {
  connection.query('select * from user where username = ?', username, function (err, result) {
    if (err) {
      console.log('err :' + err);
      return done(false, null);
    } else {
      if (result.length === 0) {
        console.log('존재하지 않는 아이디입니다.');
        return done(false, null);
      } else {
        if (!bcrypt.compareSync(password, result[0].password)) {
          console.log('패스워드가 일치하지 않습니다');
          return done(false, null);
        } else {
          console.log('로그인 성공^*^');
          req.flash('success','로그인 성공!');
          connection.query('select employee_id from user where username = ?', username, function(err, result){
            if (err) {
              console.log('error:', err);
            }
            //client.
            if (result.length === 0){
              console.log('고객입니다');
              req.redirect('/client');
            } else{ //employee
              console.log('직원입니다.');
              //직원 중에서도 경영진이랑 일반직원으로 나눠야함.
              req.redirect('/employee');

            }
          })
          // return done(null, {
          //   user_id: result[0].username,
          // });
        }
      }
    }
  })
}));

module.exports = router;
