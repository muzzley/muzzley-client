var ecstatic    = require('ecstatic');
var browserify  = require('browserify');
var fs          = require('fs');
var http        = require('http');

var server = http.createServer(
  ecstatic({ root: process.cwd() + '/tests/public' })
).listen(8081);