var ecstatic    = require('ecstatic');
var browserify  = require('browserify');
var fs          = require('fs');
var http        = require('http');
var express     = require('express');

var browserify = require('browserify-middleware');

var app = express();

app.use(express.static('./public'));
app.get('/test.js', browserify('./browserify.js'));

app.get('/testStream.js', browserify('./testStreams.js'));

app.get('/testMiddleware.js', browserify('./testMiddleware.js'));



http.createServer(app).listen(8080);