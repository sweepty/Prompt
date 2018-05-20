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

//평가 생성 페이지 get
router.get('/:id', needAuth, function(req, res, next){
  var project_id = req.params.id;
  res.render('evaluation/emp_eva',{
    user: req.user,
    title: '평가 생성페이지'
  });
});

//평가 생성
router.post('/evaluation/:project_id', function(req, res, next){
  const query = 'insert into evaluation set ?';
  const query2 = 'insert into evaluation_info set ?';

  var type_of_evaluation = req.body.type_of_evaluation; //평가 종류
  var score = req.body.score; //평가점수
  var content = req.body.content; //평가내용
  var data = {type_of_evaluation: req.body.type_of_evaluation, score: score, content: content};
  console.log(data);
});

module.exports = router;