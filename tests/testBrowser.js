var ecstatic    = require('ecstatic');
var browserify  = require('browserify');
var fs          = require('fs');
var http        = require('http');


var fs = require('fs');
var browserify = require('browserify');

//var js = browserify(['./vendor/sockjs.js']);
var js = browserify();
js.require('./lib/', {expose:'muzzley-sdk-js'});

js.add('./lib/browser-dist.js');

js.bundle(function(err, file){
  fs.writeFile(process.cwd() + '/tests/public/test-sdk-dist.js', file, function (err) {
    if (err) throw err;
    console.log('muzzley-sdk-js dist package compiled and can be tested on http://localhost:8081/dist.html');
  });
});

var js2 = browserify();
js2.require(process.cwd() + '/tests/browserify.js');

js2.bundle(function(err, file){
  fs.writeFile(process.cwd() + '/tests/public/test-sdk-browserify.js', file, function (err) {
    if (err) throw err;
    console.log('muzzley-sdk-js browserify package compiled and can be tested on http://localhost:8081/browserify.html');
  });
});


var server = http.createServer(
  ecstatic({ root: process.cwd() + '/tests/public' })
).listen(8081);

