var fs = require('fs');
var browserify = require('browserify');

var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/');
js.require('./lib/remoteCalls.js');
js.require('./lib/rpcManager.js');

js.add('./lib/browser.js');

js.bundle({watch: true, filter : require('uglify-js') }, function(err, file){
  fs.writeFile(__dirname + '/bin/muzzley-sdk.js', file, function (err) {
    if (err) throw err;
    console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-sdk.js');
  });
});