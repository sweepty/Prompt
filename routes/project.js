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

/* GET home page. */
router.get('/', needAuth, function(req, res, next) {
  console.log(req.user, '유저info');
  if (req.user.roles == "employee") {
    //직원 우선은 모든 프로젝트를 보여주도록 함.
    connection.query('select * from project',function(err,rows){
      if (err) throw(err);
      res.render('project/emp_list', {
        username: req.user.name,
        employee_id: req.user.employee_id,
        projects: rows,
        title: '프로젝트 전체 목록'
      });
    });
  } else{ //고객 의뢰한 프로젝트만 보여주기
    const client_id = req.user.client_id;
    connection.query('select p.project_id, p.name, p.EA, p.start_date, p.end_date, p.price, o.manager '+
    'from project p inner join orderer o on p.project_id = o.project_id '+
    'join client c on o.client_id = c.client_id and c.client_id =?;',client_id, function(err,rows){
      if (err) throw(err);
      res.render('project/cus_list', {
        username: req.user.name,
        client_id: client_id,
        projects: rows,
        title: '의뢰한 프로젝트 목록'
      });
    });
  }
});

//프로젝트 생성 페이지 get
router.get('/new', needAuth, function(req, res, next){
  res.render('project/emp_new',{
    user: req.user,
    title: '프로젝트 생성페이지'
  });
});

//프로젝트 생성
router.post('/new', function(req, res, next){
  const query = 'insert into project set ?';
  const query2 = 'insert into orderer set ?';

  var pname = req.body.project_name; //이름
  var startdate = req.body.start_date; //시작일
  var enddate = req.body.end_date; //종료일
  var price = req.body.price; //가격
  var client_id = req.body.client; // 발주처 client id
  var manager_name = req.body.manager_name; // 발주처 관리자 이름
  var manager_email = req.body.manager_email; // 발주처 관리자 이메일
  var data = {name: pname, startdate: startdate, enddate: enddate ,price: price};
  console.log(data);
  //project insert
  // connection.query(query,data, function(err, result){
  //   if (err) throw(err);
  //   var data2 = {project_id: result.project_id, client_id: client_id, manager: manager_name, email: manager_email};
  //   //orderer insert
  //   connection.query(query2, data2, function(err, result){
  //     if (err) throw(err);
  //     res.render('/project/bod',{
  //       username: req.user.username,
  //     });
  //   });
  //});
});

//일반직원 프로젝트 조회 (전체 v / 시작 전 / 진행중 / 완료 )
router.get('/my', function(req, res, next) {
  console.log(req.user,'유저 info확인');
  const user = req.user.employee_id;
  const all = '';
  const query = 'select distinct p.project_id, p.name, p.start_date, p.end_date, p.created_at, j.job , p.EA '+
  'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
  'join job j on w.job_id = j.job_id'
  //전체
  connection.query(query,[user], function(err,rows){
    if (err) throw(err);
    res.render('project/employee', {
      user: req.user,
      projects: rows,
      title: '참가한 프로젝트 전체'
    });
  });
});

//프로젝트 상세 조회
// router.get('/:id', function(req, res, next) {
//   var id = req.user.project_id;
//   connection.query('select * from project where project_id =?',[id], function(err, rows){
//     if (err) throw(err);
//     console.log(rows,'상세페이지 정보~~~~~~~~~~')
//     res.render('project/emp_list',{ //임시로 emp_list로 해놓음.
//       user: req.user,
//       projects: rows,
//     })
//   })
// });

//경영진 프로젝트 조회
router.get('/bod', function(req, res, next) {
  connection.query('select distinct p.project_id pid, p.name pname, c.name cname, p.start_date, p.end_date, p.price '+
  'from orderer o join project p '+
  'on o.project_id = p.project_id '+
  'join client c on o.client_id = c.client_id', function(err,rows){
    if (err) throw(err);
    res.render('project/bod', {
      user: req.user,
      projects: rows,
      title: '프로젝트 전체 조회'
    });
  });
});

module.exports = router;
