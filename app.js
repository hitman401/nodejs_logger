var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dao = require('./api/services/dao_service');
var dbConnector = dao.getDBConnector();
var http = require('http');

var app = express();
app.set('http', http);

// uncomment after placing your favicon in /api
//app.use(favicon(path.join(__dirname, 'api', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname + '/views')));
app.use('/stylesheets', express.static(path.join(__dirname + '/stylesheets')));
app.use('/bower_components',  express.static(path.join(__dirname, '/bower_components')));
app.use('/scripts', express.static(path.join(__dirname + '/scripts')));


dbConnector.connect(function(err, data) {
  if (err) {
    throw 'Error' + err;
  }
  console.log(data);
  var routes_1_0 = require('./routes/1_0');
  app.get('/',function(req,res){
    res.sendFile('index.html');
  });

  // TODO change url
  app.use('/', routes_1_0);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      var status = err.status || 500;
      res.send(status, {
        message: err.message,
        error: err
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    var status = err.status || 500;
    res.send(status, {
      message: err.message,
      error: {}
    });
  });
});

module.exports = app;
