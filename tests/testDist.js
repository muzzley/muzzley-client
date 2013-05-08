var ecstatic    = require('ecstatic');
var browserify  = require('browserify');
var fs          = require('fs');
var http        = require('http');
var express     = require('express');

var browserify = require('browserify-middleware');

var app = express();

app.use(express.static('./public'));
app.get('/test.js', browserify('./browserify.js'));



http.createServer(app).listen(8080);