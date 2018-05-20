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
  res.render('evaluation/emp_eva',{
    user: req.user,
    title: '평가 생성페이지'
  });
});

//평가 생성
router.post('/evaluation/:project_id', function(req, res, next){
  const query = 'insert into evaluation set ?';
  const query2 = 'insert into evaluation_info set ?';

  var evaluation_id = req.body.evaluation_id; //평가 id
  var evaluator_id = req.body.evaluator_id; //평가자 id
  var evaluated_id = req.body.evaluated_id; //피평가자 id
  var project_id = req.body.project_id; //프로젝트 id
  var type_of_evaluation = req.body.type_of_evaluation; //평가 종류
  var created_at = req.body.created_at; //생성일시
  var evaluation_info_id = req.body.evaluation_info_id; //평가정보 id
  var score = req.body.score; //평가점수
  var content = req.body.content; //평가내용
  var data = {score: score, content: content};
  console.log(data);
});

module.exports = router;