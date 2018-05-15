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

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
};

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query('select * from project',function(err,rows){ 
    if (err) throw(err);
    if (rows && rows.length > 0){
      var info = rows;
      // console.log(info,'프로젝트');
      res.render('project/index', {
        projects: info, 
        title: '프로젝트 전체 목록'
      });
    } else{
      res.render('project/index',{
        projects: [],
        title: '프로젝트가 존재하지 않습니다'
      })
    }
  });
});

//프로젝트 생성 페이지 get
router.get('/new', function(req, res, next){
  res.render('project/new',{title: '프로젝트 생성페이지'});
});

//프로젝트 생성 post
router.post('/new', function(req, res, next){
  const query = 'insert into project(name,startdate,enddate,price,EA) values(?,?,?,?)';
  const query2 = 'insert into orderer() values()'
  var pname = req.body.projectname;
  var startdate = req.body.startdate;
  var enddate = req.body.enddate;
  // var  = req.body.;
  // var  = req.body.;
  // var  = req.body.;
  // var  = req.body.;
  // var  = req.body.;
  // connection.query()
});
//프로젝트 수정
//프로젝트 삭제


//일반직원 프로젝트 조회 (전체 v / 시작 전 / 진행중 / 완료 )
router.get('/my', function(req, res, next) {
  const user = req.session.user.user_id[0].employee_id;
  console.log(user,'유저의 employee_id');
  const all = ''
  //전체
  connection.query(
    'select p.project_id, p.name, p.start_date, p.end_date, p.created_at, j.job , p.EA '+
    'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
    'join job j on w.job_id = j.job_id',
  [user], function(err,rows){ 
    if (err) throw(err);
    if (rows && rows.length > 0){
      var info = rows;
      // console.log(info,'프로젝트');
      res.render('project/employee', {
        projects: info, 
        title: '참가한 프로젝트 전체'
      });
    } else{
      res.render('project/employee',{
        projects: [],
        title: '참가한 프로젝트가 없습니다.'
      })
    }
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
  'join client c on o.client_id = c.client_id;'
  , function(err,rows){ 
    if (err) throw(err);
    if (rows && rows.length > 0){
      var info = rows;
      // console.log(info,'프로젝트');
      res.render('project/bod', {
        projects: info, 
        title: '프로젝트 전체 조회'
      });
    } else{
      res.render('project/bod',{
        projects: [],
        title: '프로젝트가 없습니다'
      })
    }
  });
});

module.exports = router;
