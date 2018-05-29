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

//-----------직원 조회------------
router.get('/', needAuth, function(req, res, next) {
  console.log(req.user.roles, 'management 유저info');
  if (req.user.roles.includes("management")) {
    console.log("경영진임")
    connection.query('select * from employee e join department d on e.department_id = d.department_id',function(err, rows){
      if (err) throw(err);
      connection.query('select e.employee_id, e.name e_name, p.name p_name, w.start_date, p.project_id '+
      'from	works_on w right outer join employee e on w.employee_id=e.employee_id '+
      'right outer join project p on p.project_id=w.project_id where e.employee_id is not null', function(err, result){
        if (err) throw(err)
        res.render('hr/emp_info', {
          user: req.user,
          employees: rows,
          p_employees: result,
        });
      })
    });
  }
});
// ----------이달의 사원----------
router.get('/best', function(req, res, next){
  if (req.user.roles.includes("management")) {
    console.log("경영진임")
    connection.query('select m.employee_id, m.name, avg(i.score) score '+
    'from evaluation e join evaluation_info i on e.evaluation_id=i.evaluation_id '+
    'join employee m on m.employee_id=e.evaluated_id '+
    'join question q on q.question_id=i.question_id '+
    'group by e.evaluated_id order by avg(i.score) desc limit 5', function(err, result){
      if (err) throw(err);
      res.render('hr/emp_best', {
        user: req.user,
        employees: result,
      });
    })
  }
});

//------------직원 추가----------
router.get('/new', function(req, res, next){
  connection.query('select * from department', function(err, rows){
    console.log(rows,'dkssud');
    console.log(req.user,'유저정보');
    res.render('hr/emp_new',{
      user: req.user,
      departments: rows
    });
  });
});

router.post('/new', function(req, res, next){
  var name = req.body.employee_name;
  var RRNumber = req.body.RRNumber;
  var education = req.body.education;
  var department_id = req.body.department_id;
  var email = req.body.email;
  var data = {name: name, RRNumber: RRNumber, education: education, department_id: department_id, email: email};
  console.log(data,'값확인하자');
  connection.query('insert into employee set ?',data, function(err, rows){
    if (err) throw(err);
    console.log(req.user,'직원추가 결과확인하기');
    res.redirect('/hr');
  });
});

//------------직원 수정----------
router.get('/edit', function(req, res, next){
  employee_id = req.query.id;
  console.log(req.query);
  if (req.user.roles.includes("management")) {
    if (employee_id != undefined) {
      connection.query('select * from employee e inner join department d ' + 
      'on e.department_id = d.department_id where employee_id = ?', [employee_id], function(err, rows){
        if (err) throw(err);
        console.log(rows,'머나오냐')
        res.render('hr/emp_edit', {
          user: req.user,
          employee: rows,
        });
      });
    }
  }
});

router.post('/edit/:id', function(req, res, next){
  var employee_id = req.params.id;
  var name = req.body.name;
  var RRNumber = req.body.RRNumber;
  var education = req.body.education;
  var date_of_entry = req.body.date_of_entry;
  var department_id = req.body.department_id;
  var department_name = req.body.department_name;
  var email = req.body.email;
  var data = {name: name, RRNumber: RRNumber, education: education, date_of_entry: date_of_entry, department_id: department_id, email: email};
  console.log(data,'안녕');
  connection.query('update employee set ? where employee_id = ?', [data,employee_id], function(err, rows){
    if (err) throw(err);
    console.log(rows,'결과확인');
    res.redirect('/hr');
  });
});

// -------------- 직원 삭제 -----------------
router.delete('/:id/delete', function(req, res, next){
  var id = req.params.id;
  connection.query('delete from employee where employee_id = ?', [id], function(err, rows){
    if (err) throw(err);
    res.redirect('hr/list');
  });
});

// ----------직원 상세 보기----------
router.get('/:id', function(req, res, next){
  var id = req.params.id;
  var query = 'select distinct p.project_id, p.name, p.created_at, j.job , p.EA, w.start_date, w.end_date '+
  'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
  'join job j on w.job_id = j.job_id ';
  if (req.user.roles.includes("management")) {
    console.log("경영진임")
    connection.query('select * from employee where employee_id = ?',[id], function(err, result){
      if (err) throw(err);
      connection.query('select q.question, avg(i.score) as score '+
      'from evaluation e right join evaluation_info i on e.evaluation_id=i.evaluation_id '+
      'join employee m on m.employee_id=e.evaluated_id '+
      'join question q on q.question_id=i.question_id '+
      'where e.evaluated_id = ? group by i.question_id',[id], function(err, eval_result){
        if (err) throw(err);
        connection.query('select q.question, i.score, i.content '+
        'from evaluation e right join evaluation_info i on e.evaluation_id=i.evaluation_id '+
        'join employee m on m.employee_id=e.evaluated_id '+
        'join question q on q.question_id=i.question_id '+
        'where e.evaluated_id = ?',[id], function(err, comments){
          if (err) throw(err);
          // 진행중
          connection.query(query+'where w.start_date < now() and w.end_date is NULL',[req.user.employee_id], function(err, progress){
            if (err) throw(err);
            //완료
            connection.query(query +'where w.end_date is not NULL',[req.user.employee_id], function(err, done){
              if (err) throw(err);
              // 시작 전
              connection.query(query +'where w.start_date > now()',[req.user.employee_id], function(err, notyet){
                if (err) throw(err);
                res.render('hr/emp_info_detail',{
                  user: req.user,
                  employee: result,
                  evaluations: eval_result,
                  comments: comments,
                  progress: progress,
                  done: done,
                  notyet: notyet
                })
              })
            })
          })
        });
      });
    });
  };
});

module.exports = router;
