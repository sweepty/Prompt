var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
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
  //경영진
  if (req.user.roles.includes("management")) {
    connection.query('select * from project',function(err,rows){
      if (err) throw(err);
      res.render('project/mg_list', {
        user: req.user,
        projects: rows,
        title: '프로젝트 전체 목록'
      });
    });
  } else {
    //일반직원
    if (req.user.roles.includes("employee")) {
      res.redirect('/project/my');
    } else { //고객 의뢰한 프로젝트만 보여주기 (진행중, 완료)
      const client_id = req.user.client_id;
      connection.query('select p.project_id, p.name, p.EA, p.start_date, p.end_date, p.price, o.manager '+
      'from project p inner join orderer o on p.project_id = o.project_id '+
      'join client c on o.client_id = c.client_id where c.client_id =?',client_id, function(err,rows){
        if (err) throw(err);
        res.render('project/cus_list', {
          user: req.user,
          projects: rows,
          title: '의뢰한 프로젝트 목록'
        });
      });
    }
  }
});

//프로젝트 생성 페이지 get
router.get('/new', needAuth, function(req, res, next){
  // 고객 id를 몰라도 이름으로 알 수 있도록 하기 위해서ㅇㅇ
  connection.query('select * from client', function(err, clients){
    if (err) throw(err);
    console.log(req.user,'프로젝트 생성')
    connection.query('select * from employee', function(err, employees){
      res.render('project/emp_new',{
        user: req.user,
        clients: clients,
        employees: employees,
        title: '프로젝트 생성페이지'
      });
    }) 
  });
});

//프로젝트 생성
router.post('/new', function(req, res, next){
  const query = 'insert into project set ?';
  const query2 = 'insert into orderer set ?';
  // const query3 = 'insert into works_on set ?';
  //나중에 시작일 종료일 수정하기.
  var pname = req.body.project_name; //이름
  var start_date = req.body.start_date +' '+ req.body.start_time; //시작일
  var end_date = req.body.end_date +' '+ req.body.end_time; //종료일
  var price = req.body.price; //가격
  var client_id = req.body.client_id; // 발주처
  var manager_name = req.body.manager_name; // 발주처 관리자 이름
  var manager_email = req.body.manager_email; // 발주처 관리자 이메일
  var pm = req.body.add_pm;
  var data = {name: pname, start_date: start_date, end_date: end_date, EA: false, price: price};
  
  console.log(data);

  //project insert
  connection.query(query, data, function(err, rows){
    if (err) throw(err);
    var data2 = {project_id: rows.insertId, client_id: client_id, manager: manager_name, email: manager_email};
    //orderer insert
    connection.query(query2, data2, function(err, result){
      if (err) throw(err);
      res.redirect('/project');
      // var data3 = {employee_id: pm, project_id: rows.insertId, job_id: 1};
      // connection.query(query3,data3, function(err, result){
      //   if (err) throw(err);
      //   console.log(result,'웍스온 추가 됐나확인');
      //   res.redirect('/project');
      // })
      
    });
  });
});

// 프로젝트 수정
router.get('/edit', function(req, res, next){
  if (req.user.roles.includes("management")) {
    connection.query('select * from project', function(err, rows){
      if (err) throw(err);
      res.render('project/edit', {
        user: req.user,
        project: rows,
        title: '프로젝트 전체 목록'
      });
    });
  }
});

router.post('/edit', function(req, res, next){
  var project_id = req.params.id;
  var name = req.body.name;
  var start_date = req.start_date;
  var end_date = req.body.end_date;
  var data = {name: name, start_date: start_date, end_date: end_date};
  connection.query('update project set ? where project_id = ?', [data,project_id], function(err, rows){
    if (err) throw(err);
    res.redirect('/')
  });
});

// 프로젝트 삭제
router.get('/delete', function(req, res, next){
  if (req.user.roles.includes("management")) {
    connection.query('select * from project',function(err,rows){
      if (err) throw(err);
      res.render('project/delete', {
        user: req.user,
        project: rows,
        title: '프로젝트 전체 목록'
      });
    });
  }
});
router.delete('/delete', function(req, res, next){
  var project_id = req.params.id;
  connection.query('delete from project where project_id = ?', [project_id], function(err, rows){
    if (err) throw(err);
    res.redirect('/');
  });
});

// 프로젝트 새 직원 추가
router.get('/:id/new', function(req,res, next){
  var id = req.params.id;
  connection.query('select * from employee', function(err, result){
    if (err) throw(err);
    connection.query('select * from job', function(err, job){
      res.render('project/emp_team',{
        user: req.user,
        employees: result,
        job: job,
        id: id,
      });
    });
  })
});

router.post('/:id/new', function(req, res, next){
  var id = req.params.id;
  var employee_id = req.body.employee_id;
  var start_date = req.body.start_date+' '+req.body.start_time;
  var job_id = req.body.job_id;
  var data ={project_id: id, employee_id: employee_id, job_id: job_id, start_date: start_date, end_date: null};
  console.log(data,' 데이터 확인 ');
  connection.query('insert into works_on set ?', data, function(err, result){
    if (err) throw(err);
    console.log('투입완료');
    res.redirect(`/project/${id}`);
  });
});

// 프로젝트 참여 직원 수정
router.get('/:id/edit', function(req,res, next){
  var project_id = req.params.id;
  var query_client = 'select p.name p_name, p.start_date, p.end_date, o.manager, o.email m_email, c.name c_name '+
  'from project p join orderer o on p.project_id=o.project_id '+
  'join client c on c.client_id=o.client_id '+
  'where p.project_id =?'
  var query_members =
  'select p.project_id p_id, p.name p_name, p.EA, w.start_date, w.end_date, w.end_date, e.name, e.employee_id, j.job '+
  'from project p join works_on w on p.project_id=w.project_id '+
  'join employee e on e.employee_id=w.employee_id '+
  'join job j on j.job_id=w.job_id '+
  'where p.project_id = ? and w.employee_id '
  const user = req.user;
  connection.query(query_client, [project_id], function(err, row){
    if (err) throw(err);
    var client = row[0];
    console.log(client,'pname확인');
    // 경영진인 경우
    if (req.user.roles.includes("management")) {
      connection.query(query_members, [project_id], function(err, result){
        if (err) throw(err);
        connection.query('select * from job', function(err, job){
          res.render('project/emp_edit',{
            user: req.user,
            client: client,
            project: result,
            project_id: project_id,
            job: job
          });
        });
      });
    }
  })
});

router.post('/:id/edit', function(req, res, next){
  var id = req.params.id;
  var end_date = req.body.end_date+' '+req.body.end_time;
  var job_id = req.body.job_id;
  var data = {end_date: end_date, job_id: job_id};
  connection.query('update works_on set ? where employee_id = ?', [data,id], function(err, rows){
    if (err) throw(err);
    console.log('수정 성공~');
    res.redirect('/project/${id}');
  });
});

// 프로젝트 참여 직원 삭제
router.get('/:id/delete', function(req,res, next){
  var project_id = req.params.id;
  var query_client = 'select p.name p_name, p.start_date, p.end_date, o.manager, o.email m_email, c.name c_name '+
  'from project p join orderer o on p.project_id=o.project_id '+
  'join client c on c.client_id=o.client_id '+
  'where p.project_id =?'
  var query_members =
  'select p.project_id p_id, p.name p_name, p.EA, w.start_date, w.end_date, w.end_date, e.name, e.employee_id, j.job '+
  'from project p join works_on w on p.project_id=w.project_id '+
  'join employee e on e.employee_id=w.employee_id '+
  'join job j on j.job_id=w.job_id '+
  'where p.project_id = ? and w.employee_id '
  const user = req.user;
  connection.query(query_client, [project_id], function(err, row){
    if (err) throw(err);
    var client = row[0];
    if (req.user.roles.includes("management")) {
      connection.query(query_members, [project_id], function(err, result){
        if (err) throw(err);
        connection.query('select * from job', function(err, job){
          res.render('project/emp_delete',{
            user: req.user,
            client: client,
            project: result,
            project_id: project_id,
            job: job
          });
        });
      });
    }
  })
});
router.delete('/:id/delete', function(req, res, next){
  var id = req.params.id;
  connection.query('delete from works_on where employee_id = ?',[id], function(err, rows){
    if (err) throw(err);
    res.redirect('/project/${id}/delete');
  });
});

//----------------직원 프로젝트(진행, 완료, 시작) 페이지------------------------
var queryy = 'select distinct p.project_id, p.name, p.created_at, j.job , p.EA, w.start_date, w.end_date '+
'from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? '+
'join job j on w.job_id = j.job_id ';
//진행중인 프로젝트
function findinProgress(req, res, next) {
  //현재시간
  var now = new Date();
  console.log(now.getTime()); //unix 1526915447212
  var current = now.getTime();
  console.log(moment(now.getTime()).format());//timestamp 2018-05-22T00:10:47+09:00

  var request = queryy+'where w.end_date is NULL'; // and where UNIX_TIMESTAMP(w.start_date) < ?
  connection.query(request,[req.user.employee_id, current], function(err, rows) {
    if (err) throw(err);
    console.log(rows,'타임스탬프확인')
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

//시작 전인 프로젝트
function findDidNotStart(req, res, next) {
  var request = queryy +'where w.start_date > now()';
  connection.query(request,[req.user.employee_id], function(err, rows) {
    if (err) throw(err);
    console.log(rows);
    req.notyet = rows;
    next();
  });
}

function renderProjectPage(req, res) {
  res.render('project/employee', {
    inProgress: req.in_progress,
    done: req.done,
    title: '참가한 프로젝트 전체',
    notyet: req.notyet,
    user: req.user
  });
};
router.get('/my', needAuth, findinProgress, findDone, findDidNotStart, renderProjectPage);

//------------------ 프로젝트 상세 조회-----------------------------------
router.get('/:id', function(req, res, next) {
  var project_id = req.params.id;
  var query_client = 'select p.name p_name, p.start_date, p.end_date, o.manager, o.email m_email, c.name c_name '+
  'from project p join orderer o on p.project_id=o.project_id '+
  'join client c on c.client_id=o.client_id '+
  'where p.project_id =?'
  var query_members =
  'select p.project_id p_id, p.name p_name, p.EA, w.start_date, w.end_date, w.end_date, e.name, e.employee_id, j.job '+
  'from project p join works_on w on p.project_id=w.project_id '+
  'join employee e on e.employee_id=w.employee_id '+
  'join job j on j.job_id=w.job_id '+
  'where p.project_id = ? and w.employee_id '
  const user = req.user;
  connection.query(query_client, [project_id], function(err, row){
    if (err) throw(err);
    var client = row[0];
    console.log(client,'pname확인');
    // 경영진인 경우
    if (req.user.roles.includes("management")) {
      connection.query(query_members, [project_id], function(err, result){
        if (err) throw(err);
        res.render('project/emp_m_detail',{
          user: req.user,
          client: client,
          project: result,
          project_id: project_id
        })
      });
    } else {
      //일반 직원
      if (req.user.roles.includes("employee")) {
        //자신에 대한 정보
        connection.query(query_members+'= ?', [project_id, user.employee_id], function(err, rows){
          if (err) throw(err);
          var my = rows;
          // 자신을 제외한 팀원들을 보여주도록 함.
          connection.query(query_members+'not in (?)',[project_id, user.employee_id], function(err, result){
            if (err) throw(err);
            console.log(rows,'프로젝트확인');
            console.log(client,'고객있나확인 왜 안뜨냐')
            res.render('project/emp_detail',{
              user: req.user,
              client: client,
              project: result,
              my: my,
              title: '프로젝트 상세 조회'
            });
          })
        });
      } else { //고객


      }
    }
  })
});
module.exports = router;