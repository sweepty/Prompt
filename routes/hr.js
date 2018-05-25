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
      console.log(rows);
      connection.query('select e.employee_id, e.name e_name, p.name p_name, w.start_date '+
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
// ----------직원 상세 보기----------
router.get('/:id', function(req, res, next){
  var id = req.params.id;
  console.log(req.params.id,'아이디?');
  if (req.user.roles.includes("management")) {
    console.log("경영진임")
    connection.query('select e.employee_id, p.project_id, e.name e_name, p.name p_name, w.start_date, w.end_date '+
    'from	works_on w right outer join employee e on w.employee_id=e.employee_id '+
    'right outer join project p on p.project_id=w.project_id where e.employee_id = ?',[id],function(err, rows){
      if (err) throw(err);
      res.render('hr/emp_info_detail', {
        user: req.user,
        employee: rows
      });
    });
  }
});

//------------직원 수정----------
router.get('/:id/edit', function(req, res, next){
  var id = req.params.id;
  connection.query('select * from employee where employee_id = ?',[id], function(err, result){
    if (err) throw(err);
    res.render('hr/edit',{
      user: req.user,
      employee: result
    });
  });
});

router.post('/:id/edit', function(req, res, next){
  var id = req.params.id;
  var name = req.body.name;
  var RRNumber = req.body.RRNumber;
  var education = req.body.education;
  var department = req.body.department;
  var email = req.body.email;
  var data = {name: name, RRNumber: RRNumber, education: education, department: department, email: email};
  connection.query('update employee set ? where employee_id = ?',[data,id], function(err, rows){
    if (err) throw(err);
    res.render('hr/detail', {
      user: req.user,
    });
  });
});

// -------------- 직원 삭제 -----------------
router.delete('/:id/delete', function(req, res, next){
  var id = req.params.id;
  connection.query('delete from employee where employee_id = ?',[id], function(err, rows){
    if (err) throw(err);
    res.redirect('hr/list');
  });
});
module.exports = router;