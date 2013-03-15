var fs = require('fs');
var UglifyJS = require("uglify-js");
var browserify = require('browserify');
var version = require('./package.json');


var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/', {expose:'muzzley-sdk-js'});

js.add('./lib/browser-dist.js');

js.bundle(function(err, file){

  var minified = UglifyJS(file);

  fs.writeFile(__dirname + '/dist/muzzley-client-'+ version.version + '.js', file, function (err) {
    if (err) throw err;
    console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-client-'+ version.version +'.js');
  });

  fs.writeFile(__dirname + '/dist/muzzley-client-'+ version.version + '.min.js', minified, function (err) {
    if (err) throw err;
    console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-client-'+ version.version +'.min.js');
  });

  fs.writeFile(__dirname + '/tests/public/muzzley-client-'+ version.version + '.min.js', minified, function (err) {
    if (err) throw err;
    console.log('Just run the command:');
    console.log('node tests/testDist.js');
    console.log('And open the link: http://localhost:8081/min.html (and check the console)');
  });
});


