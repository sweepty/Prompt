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
  if (req.user.roles[0] == "employee") {
    //직원 우선은 모든 프로젝트를 보여주도록 함.
    connection.query('select * from project',function(err,rows){
      if (err) throw(err);
      res.render('project/emp_list', {
        user: req.user,
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
        user: req.user,
        projects: rows,
        title: '의뢰한 프로젝트 목록'
      });
    });
  }
});

//프로젝트 생성 페이지 get
router.get('/new', needAuth, function(req, res, next){
  // 고객 id를 몰라도 이름으로 알 수 있도록 하기 위해서ㅇㅇ
  connection.query('select client_id, name from client', function(err, rows){
    // connection.query('select * from employee')
    res.render('project/emp_new',{
      user: req.user,
      clients: rows,
      title: '프로젝트 생성페이지'
    });
  });
});

//프로젝트 생성
router.post('/new', function(req, res, next){
  const query = 'insert into project set ?';
  const query2 = 'insert into orderer set ?';
  //나중에 시작일 종료일 수정하기.
  var pname = req.body.project_name; //이름
  var start_date = req.body.start_date +' '+ req.body.start_time; //시작일
  var end_date = req.body.end_date +' '+ req.body.end_time; //종료일
  var price = req.body.price; //가격
  var client_id = req.body.client_id; // 발주처
  var manager_name = req.body.manager_name; // 발주처 관리자 이름
  var manager_email = req.body.manager_email; // 발주처 관리자 이메일
  var data = {name: pname, start_date: start_date, end_date: end_date, EA: false, price: price};
  console.log(data);
  //project insert
  connection.query(query, data, function(err, rows){
    if (err) throw(err);
    var data2 = {project_id: rows.insertId, client_id: client_id, manager: manager_name, email: manager_email};
    //orderer insert
    connection.query(query2, data2, function(err, result){
      if (err) throw(err);
      //이부분이 이상하다.
      res.render('/project');
    });
  });
});

//----------------직원 프로젝트(진행, 완료, 시작) 페이지------------------------
var queryy = 'select distinct p.project_id, p.name, p.start_date, p.end_date, p.created_at, j.job , p.EA, w.start_date '+
'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
'join job j on w.job_id = j.job_id ';
//진행중인 프로젝트
function findinProgress(req, res, next) {
  var request = queryy+'where w.end_date is NULL';
  connection.query(request,[req.user.employee_id], function(error, rows) {
    req.in_progress = rows;
    return next();
  });
}
//완료한 프로젝트
function findDone(req, res, next) {
  var request = queryy +'where w.end_date is not NULL';
  connection.query(request,[req.user.employee_id], function(error, rows) {
    req.done = rows;
    next();
  });
}

// //시작 전인 프로젝트
// function findDidNotStart(req, res, next) {
//   var now = new Date();
//   console.log( now.getTime() );
//   // var today = moment.utc().day();
//   // console.log(today);
//   // var todayTimestampStart = moment(today+' 00:00:00').format('x');
//   var request = queryy +'where DATE(w.start_date) > ?';
//   connection.query(request,[now.getTime(),req.user.employee_id], function(error, rows) {
//     console.log(rows[0].start_date,'오늘의 타임스탬프~~');
//     console.log(rows);
//     req.notstart = rows;
//     next();
//   });
// }

function renderProjectPage(req, res) {
  res.render('project/employee', {
    inProgress: req.in_progress,
    done: req.done,
    title: '참가한 프로젝트 전체',
    user: req.user
  });
}
router.get('/my',needAuth, findinProgress, findDone, renderProjectPage);

//------------------ employee 프로젝트 상세 조회-----------------------------------
router.get('/:id', function(req, res, next) {
  var project_id = req.params.id;
  var query_client = 'select p.name p_name, p.start_date, p.end_date, o.manager, o.email m_email, c.name c_name '+
  'from project p join orderer o on p.project_id=o.project_id '+
  'join client c on c.client_id=o.client_id '+
  'where p.project_id =?'
  var query_members =
  'select p.project_id p_id, p.EA, w.start_date, w.end_date, w.end_date, e.name, j.job '+
  'from project p join works_on w on p.project_id=w.project_id '+
  'join employee e on e.employee_id=w.employee_id '+
  'join job j on j.job_id=w.job_id '+
  'where p.project_id = ? and w.employee_id '
  connection.query(query_client, [project_id], function(err, rows){
    if (err) throw(err);
    var client = rows[0];
    //자신에 대한 정보
    connection.query(query_members+'= ?', [project_id, req.user.employee_id], function(err, rows){
      if (err) throw(err);
      var my = rows;
      // 자신을 제외한 팀원들을 보여주도록 함.
      connection.query(query_members+'not in (?)',[project_id, req.user.employee_id], function(err, rows){
        if (err) throw(err);
        console.log(rows,'프로젝트확인');
        res.render('project/emp_detail',{
          user: req.user,
          client: client,
          project: rows,
          my: my,
          title: '프로젝트 상세 조회'
        });
      })
    });
  })
});




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
