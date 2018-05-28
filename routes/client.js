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
// 고객 리스트 조회 페이지
router.get('/', function(req, res, next){
  connection.query('select * from client', function(err, rows){
    if (err) throw(err);
    res.render('customer/cus_list',{
      user: req.user,
      clients: rows
    });
  });
});
//------------고객 추가----------
router.get('/new', function(req, res, next){
  res.render('customer/cus_new.pug',{
    user: req.user
  });
});

router.post('/new', function(req, res, next){
  var name = req.body.client_name;
  var tel = req.body.tel;
  var address = req.body.address;
  var data = {name: name, tel: tel, address: address};
  connection.query('insert into client set ?', data, function(err, rows){
    if (err) throw(err);
    res.redirect('back');
  });
});

//------------고객 수정----------
router.get('/edit', function(req, res, next){
  client_id = req.query.id;
  connection.query('select * from client c inner join orderer o ' + 
  'on c.client_id = o.client_id where c.client_id = ? group by c.client_id', [client_id], function(err, rows){
    if (err) throw(err);
    console.log(rows, '고객 수정');
    res.render('customer/cus_edit',{
      user: req.user,
      client: rows,
    });
  });
});

router.post('/edit', function(req, res, next){
  var id = req.params.id;
  var name = req.body.name;
  var tel = req.body.tel;
  var address = req.body.address;
  var manager = req.body.manager;
  var email = req.body.email;
  var data = {name: name, tel: tel, address: address, manager: manager, email: email};
  connection.query('update client set ? where client_id = ?', [data, id], function(err, rows){
    if (err) throw(err);
    res.redirect('/client');
  });
});

// 고객 상세 조회 페이지
router.get('/:id',function(req, res, next){
  var id = req.params.id;
  console.log(req.params.id, "나와주세요");
  connection.query('select * from client where client_id = ?',[id], function(err, result){
    if (err) throw(err);
    connection.query('select c.client_id c_id, c.name c_name, c.tel, c.address, o.manager, o.email, ' +
    'p.project_id p_id, p.name p_name, p.start_date, p.end_date, p.price ' +  
    'from client c join orderer o on c.client_id=o.client_id '+
    'join project p on p.project_id=o.project_id where c.client_id = ?', [id], function(err, rows){
      if (err) throw(err);
      console.log(rows,'고객 상세');
      res.render('customer/cus_detail',{
        user: req.user,
        client: result,
        projects: rows,
        id: id
      });
    });
  });
});

// -------------- 고객 삭제 -----------------
router.delete('/:id/delete', function(req, res, next){
  var id = req.params.id;
  connection.query('delete from client where client_id = ?', [id], function(err, rows){
    if (err) throw(err);
    console.log(rows,'삭제 성공했나요?');
    res.redirect('/client');
  });
});


module.exports = router;