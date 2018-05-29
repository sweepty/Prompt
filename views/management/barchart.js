var express = require('express');
var router = express.Router();
var mysql_dbc = require('../db/db_con')();
var connection = mysql_dbc.init();
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
var d3 = require("d3");
mysql_dbc.test_open(connection);

var dataArray = [23, 13, 21, 14, 37, 15, 18, 34, 30];

var svg = d3.select("body").append("svg")
          .attr("height","100%")
          .attr("width","100%");

svg.selectAll("rect")
    .data(dataArray)
    .enter().append("rect")
          .attr("height","250")
          .attr("width","40")
          .attr("x", function(d, i) {return (i * 60) + 25})
          .attr("y","50");