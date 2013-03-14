var fs = require('fs');
var browserify = require('browserify');

var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/', {expose:'muzzley-sdk-js'});

js.add('./lib/browser-dist.js');

js.bundle({watch: true, filter : require('uglify-js') }, function(err, file){
  fs.writeFile(__dirname + '/dist/muzzley-sdk.js', file, function (err) {
    if (err) throw err;
    console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-sdk.js');
  });
});