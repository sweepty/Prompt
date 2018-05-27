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
  var query_q = 'select * from question';
  var query2 = 'select * from project where project_id = ?';

  if (req.user.roles.includes('management')) {
    res.redirect('back')
  } else {
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
          evaluated_id: req.params.member_id,
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
  var score = req.body.score;
  var content = req.body.content;
  
  //질문개수 받기
  connection.query('select count(*) from question', function(err, num){
    if (err) throw(err);
    // 고객
    if (req.user.roles.includes('client')) {
      var data = {evaluator_id: req.user.client_id, evaluated_id: req.params.member_id, type_of_evaluation: 'client'};
      connection.query(query, data, function(err, rows){
        if (err) throw(err);
        var data2 = {evaluation_id: rows.insertId, question_id: rows.insertId, score: score, content: content};
        connection.query(query2, data2, function(err, result){
          if (err) throw(err);
          res.redirect(`/evaluation/${req.params.id}/form/${req.params.member_id}`);
        });
      });
    }

    //직원 
    else {
      // 경영진
      if (req.user.roles.includes('management')){
        res.redirect('/evaluation');
      }
      // 직원
      else{
        //사용자가 pm인지 아닌지 판별
        connection.query(isPM, [req.user.employee_id, req.params.id], function(err, result){
          if (err) throw(err);
          console.log(result,'pmdlswl dkslswl ghkrdlsgoddfu');
          console.log(req.body,'바디에 뭐있나확인');
          console.log(req.body.question_id.length,'길이확인')
          if (result.job == 'PM') {
            
            console.log('현재 평가자가 pm이므로 pm 평가로 넘어갑니다.');
            // 질문 각 바디에 넣기
            for(i=0; i < req.body.question_id.length; i++){
              console.log(req.body.question_id[i],'번호임');
              // var i = {evaluation_id: result.insertId, question_id: rows.insertId, score: score, content: content}
            }
            var data = {project_id: req.params.id, evaluator_id: req.user.employee_id, evaluated_id: req.params.member_id, type_of_evaluation: 'pm'};

            // connection.query(query, data, function(err, result){
            //   if (err) throw(err);
            //   console.log(result, '첫번째 insert 잘 되었나 확인');

            //   var data2 = {evaluation_id: result.insertId, question_id: rows.insertId, score: score, content: content};
            //   connection.query(query2, data2, function(err, result2){
            //     if (err) throw(err);
            //     console.log(result2, '두번째 insert 잘 되었음. 확인해보세요 calllbackkkhelll');
            //     res.redirect(`/evaluation/${req.params.id}/form/${req.params.member_id}`);

            //   });
            // });
          } else {
            console.log('동료평가임')
            
            // for(i=0; i < req.body.question_id.length; i++){
            //   // var i = {evaluation_id: result.insertId, question_id: req.body.question_id[i], score: req.body.score[i], content: req.body.content[i]};
            //   var i = {question_id: req.body.question_id[i], score: req.body.score[i], content: req.body.content[i]};
            //   console.log(i,'info에 넣을 데이터 확인')
            //   // connection.query(query2, i, function(err, result2){
            //   //   if (err) throw(err);
            //   //   console.log(result2, '두번째 insert 잘 되었음. 확인해보세요 calllbackkkhelll');
            //   // });
            // }
            //evaluation에 넣을 거
            var data = {project_id: req.params.id, evaluator_id: req.user.employee_id, evaluated_id: req.params.member_id, type_of_evaluation: 'peer'};
            console.log(data,'evaluation에 넣을 데이터 확인')

            connection.query(query, data, function(err, result){
              if (err) throw(err);
              console.log(result, '첫번째 insert 잘 되었나 확인');
              console.log(req.body.question_id.length,'길이');
              // 질문 각 바디에 넣기
              for(i=0; i < req.body.question_id.length; i++){
                // var i = {evaluation_id: result.insertId, question_id: req.body.question_id[i], score: req.body.score[i], content: req.body.content[i]};
                // console.log(i,'info에 넣을 데이터 확인')
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
  })
});

module.exports = router;