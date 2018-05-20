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
  connection.query('select * from (user left outer join authorities on user.user_id = authorities.user_id) left outer join role  on authorities.role_id = role.role_id where username = ?', [username], function (err, result) {
    // 어차피 return하면 아래 행은 실행되지 않는거기 때문에 이런식으로 짜는게 훨씬 보기 좋아요.
    if (err) {
      console.log('err :' + err);
      return done(false, null);
    }

    //사용자가 없는경우
    if (result.length === 0) {
      console.log('사용자가 없습니다.');
      return done(false, null);
    }

    user = result[0]
    //비밀번호가 일치하지 않는 경우
    if (!bcrypt.compareSync(password, user.password)) {
      return done(false, null);
    }

    roles = []
    //사용자 권한 체크
    for(var i in result) {
      if(result[i].role != null) {
        roles.push(result[i].role)
      }
    }
    //사용자 role 확인
    if (user.client_id != null){
      console.log('고객입니다');
      console.log(user,'고객정보 확인');
      roles.unshift('client')
      return done(null, {
        username: user.username,
        user_id: user.user_id,
        client_id: user.client_id,
        roles: roles
      });
    } else { //직원
      console.log('직원입니다.');
      console.log(user,'직원정보 확인');
      roles.unshift('employee')
      return done(null, {
        username: user.username,
        user_id: user.user_id,
        employee_id: user.employee_id,
        roles: roles
      });
    }
  })
}));

module.exports = router;
