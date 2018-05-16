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
  console.log(req.session.user.user[0], '유저info');
  connection.query('select * from project',function(err,rows){
    if (err) throw(err);
    if (rows && rows.length > 0){
      var info = rows;
      res.render('project/index', {
        user: req.session.user.user[0],
        projects: info, 
        title: '프로젝트 전체 목록'
      });
    }
  });
});

//프로젝트 생성 페이지 get
router.get('/new', needAuth, function(req, res, next){
  res.render('project/new',{
    user: req.session.user.user[0],
    title: '프로젝트 생성페이지'
  });
});

//프로젝트 생성 
router.post('/new', function(req, res, next){
  const query = 'insert into project set ?';
  const query2 = 'insert into orderer set ?';
  
  var pname = req.body.projectname; //이름
  var startdate = req.body.startdate; //시작일
  var enddate = req.body.enddate; //종료일
  var price = req.body.price; //가격
  var client_id = req.body.client; // 발주처 client id
  var manager_name = req.body.managername; // 발주처 관리자 이름
  var manager_email = req.body.manageremail; // 발주처 관리자 이메일
  var data = {name: pname, startdate: startdate, enddate: enddate ,price: price};
  //project insert
  connection.query(query,data, function(err, result){
    if (err) throw(err);
    //project_id를 어디서 가져옴? insert의 result에 있나?
    var data2 = {project_id: result.project_id, client_id: client_id, manager: manager_name, email: manager_email};
    //orderer insert
    connection.query(query2,data2, function(err, result){
      if (err) throw(err);
      
      
    })
  });
});

//일반직원 프로젝트 조회 (전체 v / 시작 전 / 진행중 / 완료 )
router.get('/my', function(req, res, next) {
  console.log(req.session.user.user[0],'유저 info확인');
  const user = req.session.user.user[0].employee_id;
  const all = '';
  const query = 'select p.project_id, p.name, p.start_date, p.end_date, p.created_at, j.job , p.EA '+
  'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
  'join job j on w.job_id = j.job_id'
  //전체
  connection.query(query,[user], function(err,rows){
    if (err) throw(err);
    res.render('project/employee', {
      user: req.session.user.user[0],
      projects: rows,
      title: '참가한 프로젝트 전체'
    });
  });
});

//프로젝트 상세 조회
router.get('/my/:id', function(req, res, next) {

});

//경영진 프로젝트 조회
router.get('/bod', function(req, res, next) {
  connection.query('select p.project_id pid, p.name pname, c.name cname, p.start_date, p.end_date, p.price '+
  'from orderer o join project p '+
  'on o.project_id = p.project_id '+
  'join client c on o.client_id = c.client_id'
  , function(err,rows){
    if (err) throw(err);
    res.render('project/bod', {
      user: req.session.user.user[0],
      projects: rows,
      title: '프로젝트 전체 조회'
    });
  });
});

module.exports = router;
