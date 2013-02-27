var ecstatic    = require('ecstatic');
var browserify  = require('browserify');
var fs          = require('fs');
var http        = require('http');


var fs = require('fs');
var browserify = require('browserify');

var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/');
js.require('./lib/remoteCalls.js');
js.require('./lib/rpcManager.js');

js.add('./lib/browser.js');

js.bundle(function(err, file){
  fs.writeFile(process.cwd() + '/tests/public/muzzley-sdk.js', file, function (err) {
    if (err) throw err;
    console.log('muzzley-sdk is ready to test');
  });
});

var js2 = browserify();
js2.require('./clientRequire.js');

js2.bundle(function(err, file){
  fs.writeFile(process.cwd() + '/tests/public/testRequire.js', file, function (err) {
    if (err) throw err;
    console.log('test Require is ready to test');
  });
});


var server = http.createServer(
  ecstatic({ root: process.cwd() + '/tests/public' })
).listen(8081);

