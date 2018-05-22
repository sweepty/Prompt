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

//질문
router.get('/:id', function(req, res, next) {
  connection.query('select distinct ei.evaluation_info_id ei_id, ei.score ei_score, ei.content ei_content, q.question_id q_id, q.score q_score, q.comment q_comment, q.question q_question '+
  'from evaluation_info ei join question q '+
  'on ei.question_id = q.question_id ', function(err,rows){
    if (err) throw(err);
    res.render('/evaluation/:project_id', {
      user: req.user,
      question: question,
      title: '질문'
    });
  });
});
module.exports = router;