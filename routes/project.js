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
        title: '프로젝트 전체 목록',
        role: req.user.roles
      });
    } else{
      res.render('project/index',{
        projects: [],
        title: '프로젝트가 존재하지 않습니다',
        role: req.user.roles
      })
    }
  });
});
router.get('/employee', function(req, res, next) {
  const user = req.session.user.user_id[0].employee_id;
  console.log(user,'유저의 employee_id');
  connection.query('select p.project_id, p.name, p.start_date, p.end_date, p.created_at, j.job , p.EA from works_on w join project p on w.project_id = p.project_id and w.employee_id = ? join job j on w.job_id = j.job_id',
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

router.get('/bod', function(req, res, next) {
  connection.query('select p.project_id pid, p.name pname, c.name cname, p.start_date, p.end_date, p.price from orderer o join project p on o.project_id = p.project_id join client c on o.client_id = c.client_id;'
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
