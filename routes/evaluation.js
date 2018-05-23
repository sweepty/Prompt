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

// //평가 생성 페이지 get
// router.get('/:id', needAuth, function(req, res, next){
//   var project_id = req.params.id;
//   res.render('evaluation/emp_eva',{
//     user: req.user,
//     title: '평가 생성페이지'
//   });
// });

//평가 생성
router.post('/:id', function(req, res, next){
  const query = 'insert into project set ?';
  const query2 = 'insert into evaluation set ?';

  var pname = req.body.project_name;
  var type_of_evaluation = req.body.type_of_evaluation; //평가 종류
  var score = req.body.score; //평가점수
  var content = req.body.content; //평가내용
  var data = {name: pname, type_of_evaluation: req.body.type_of_evaluation, score: score, content: content};
  console.log(data);
  //project insert
  connection.query(query, data, function(err, rows){
    if (err) throw(err);
    var data2 = {project_id: rows.insertId, client_id: client_id, manager: manager_name, email: manager_email};
    //orderer insert
    connection.query(query2, data2, function(err, result){
      if (err) throw(err);
      //이부분이 이상하다.
      res.render('evaluation/emp_eva');
    });
  });
});

//질문
router.get('/:id', function(req, res, next) {
  var project_id = req.params.id;
  var query_q = 'select distinct ei.evaluation_info_id ei_id, ei.score ei_score, ei.content ei_content, q.question_id q_id, q.score q_score, q.comment q_comment, q.question q_question '+
  'from evaluation_info ei join question q '+
  'on ei.question_id = q.question_id '
  const user = req.user;
  connection.query(query_q, function(err,rows){
    if (err) throw(err);
    console.log(rows,'평가목록');
    res.render('evaluation/emp_eva', {
      user: req.user,
      question: rows,
      title: '질문'
    });
  });
});
module.exports = router;