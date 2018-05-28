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
//평가 메인
router.get('/', needAuth, function(req, res, next){
  // 경영진
  if (req.user.roles.includes('management')) {
    connection.query('select * from project where EA = true or end_date < now()', function(err, rows){
      if (err) throw(err);
      res.render('evaluation/mg_list',{
        user: req.user,
        projects: rows
      });
    })
  } else { 
    // 고객
    if (req.user.roles.includes('client')) {
      connection.query('select p.project_id p_id ,p.name p_name, p.start_date p_start_date, p.end_date p_end_date '+
      'from project p join orderer o on p.project_id=o.project_id '+
      'join client c on c.client_id=o.client_id '+
      'where (p.EA = true or p.end_date < now()) and o.client_id= ?',[req.user.client_id], function(err, result){
        if (err) throw(err);
        res.render('evaluation/cus_list',{
          projects: result,
          user: req.user
        });
      });
    } else { // 일반직원
      connection.query('select * from works_on w join project p on p.project_id=w.project_id '+
      'where (p.EA = true or p.end_date < now()) and w.employee_id = ?',[req.user.employee_id], function(err, result){
        if (err) throw(err);
        res.render('evaluation/emp_list',{
          projects: result,
          user: req.user
        });
      });
    }
  }
});

// 평가하고자 하는 프로젝트 memberlist
router.get('/:id', function(req, res, next) {
  var project_id = req.params.id;
  var query_client = 'select * from works_on w join employee e on w.employee_id=e.employee_id where w.project_id = ?';
  var query_employee = 'select * from works_on w join employee e on w.employee_id=e.employee_id where w.project_id = ? and w.employee_id != ?';
  var query2 = 'select * from project where project_id = ?';

  if (req.user.roles.includes('management')) {
    connection.query(query_client, [project_id],function(err,rows){
      if (err) throw(err);
      connection.query(query2, [project_id], function(err, result){
        console.log(rows,'평가목록');
        res.render('evaluation/emp_member_list', {
          user: req.user,
          project: result,
          members: rows,
        });
      }); 
    });
  } else {
    if (req.user.roles.includes('client')) {
      connection.query(query_client, [project_id],function(err,rows){
        if (err) throw(err);
        connection.query(query2, [project_id], function(err, result){
          console.log(rows,'평가목록');
          res.render('evaluation/emp_member_list', {
            user: req.user,
            project: result,
            members: rows,
          });
        }); 
      });
    } 
    //일반직원
    else {
      connection.query(query_employee, [project_id, req.user.employee_id],function(err,rows){
        if (err) throw(err);
        connection.query(query2, [project_id], function(err, result){
          console.log(rows,'평가목록');
          res.render('evaluation/emp_member_list', {
            user: req.user,
            project: result,
            members: rows,
          });
        }); 
      });
    }
  }
});

// 평가 폼
router.get('/:id/form/:member_id', function(req, res, next) {
  var project_id = req.params.id;
  var evaluated_id = req.params.member_id;
  // 질문 불러오기
  var query_q = 'select * from question';
  // 프로젝트 상세
  var query2 = 'select * from project where project_id = ?';
  // 피평가자 정보
  var query_evaluated = 'select w.project_id, e.employee_id, e.name, w.start_date w_start_date, w.end_date w_end_date, '+
  'j.job from works_on w join employee e on w.employee_id=e.employee_id join job j on j.job_id=w.job_id where w.employee_id = ? and w.project_id= ?';

  if (req.user.roles.includes('management')) {
    res.redirect('back')
  } else {
    connection.query(query_evaluated,[evaluated_id, project_id], function(err, evaluated){
      if (err) throw(err);

      connection.query(query_q, function(err,rows){
        if (err) throw(err);
        console.log(evaluated_id,'ppppp평가자 아이디 확인함')
  
        connection.query(query2, [project_id], function(err, result){
          if (err) throw(err);
          console.log(rows,'평가목록');
  
          res.render('evaluation/emp_eva', {
            user: req.user,
            project: result,
            questions: rows,
            evaluated: evaluated
          });
        }); 
      });
    });
  }
});

//평가 생성
router.post('/:id/form/:member_id', function(req, res, next){
  //job과 role에 따라 나누자
  var query = 'insert into evaluation set ?';
  var query2 = 'insert into evaluation_info set ?';
  var isPM = 'select j.job job '+
  'from works_on w join employee e on w.employee_id=e.employee_id '+
  'join job j on w.job_id = j.job_id '+
  'where e.employee_id = ? and w.project_id = ?';

  console.log(req.params.member_id,'피평가자 id확인하기');
  // 고객  - 외않되@@@@@@@@@@@@여기 되나 확인하기 기억이 안난다 근데 된거 같은데
  if (req.user.roles.includes('client')) {
    var data = {project_id: req.params.id, evaluator_id: req.user.client_id, evaluated_id: req.params.member_id, type_of_evaluation: 'client'};
    console.log(data,'evaluation에 넣을 데이터 확인')
    
    connection.query(query, data, function(err, result){
      if (err) throw(err);
      // 질문 각 바디에 넣기
      for(i=0; i < req.body.question_id.length; i++){
        connection.query('insert into evaluation_info(evaluation_id, question_id, score, content) values(?,?,?,?)', 
        [result.insertId, req.body.question_id[i], req.body.score[i], req.body.content[i]], function(err, result2){
          if (err) throw(err);
        });
      }
    });
    res.redirect(`/evaluation/${req.params.id}`);
  }

  //직원 
  else {
    // 경영진
    if (req.user.roles.includes('management')){
      res.redirect('/evaluation'); //@@@@2추가
    }
    // 직원
    else{
      //사용자가 pm인지 아닌지 판별
      connection.query(isPM, [req.user.employee_id, req.params.id], function(err, result){
        if (err) throw(err);
        console.log(result[0].job,'이 프로젝트에서의 내 직무');
        if (result[0].job == 'PM') {
          
          console.log('현재 평가자가 pm이므로 pm 평가로 넘어갑니다.');
          var data = {project_id: req.params.id, evaluator_id: req.user.employee_id, evaluated_id: req.params.member_id, type_of_evaluation: 'PM'};
          console.log(data,'evaluation에 넣을 데이터 확인')

          connection.query(query, data, function(err, result){
            if (err) throw(err);
            // 질문 각 바디에 넣기
            for(i=0; i < req.body.question_id.length; i++){
              connection.query('insert into evaluation_info(evaluation_id, question_id, score, content) values(?,?,?,?)', 
              [result.insertId, req.body.question_id[i], req.body.score[i], req.body.content[i]], function(err, result2){
                if (err) throw(err);
              });
            }
          });
          res.redirect(`/evaluation/${req.params.id}`);
        } else {
          console.log('동료평가임')
          //evaluation에 넣을 거
          var data = {project_id: req.params.id, evaluator_id: req.user.employee_id, evaluated_id: req.params.member_id, type_of_evaluation: 'peer'};
          console.log(data,'evaluation에 넣을 데이터 확인')

          connection.query(query, data, function(err, result){
            if (err) throw(err);
            console.log(result, '첫번째 insert 잘 되었나 확인');
            console.log(req.body.question_id.length,'길이');
            // 질문 각 바디에 넣기
            for(i=0; i < req.body.question_id.length; i++){
              connection.query('insert into evaluation_info(evaluation_id, question_id, score, content) values(?,?,?,?)', 
              [result.insertId, req.body.question_id[i], req.body.score[i], req.body.content[i]], function(err, result2){
                if (err) throw(err);
                console.log(result2, '두번째 insert 잘 되었음. 확인해보세요 calllbackkkhelll');
              });
            }
          });
          res.redirect(`/evaluation/${req.params.id}`);
        }
      });
    }
  }
});

module.exports = router;