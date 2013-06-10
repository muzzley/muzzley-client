var fs = require('fs');
var UglifyJS = require("uglify-js");
var browserify = require('browserify');
var version = require('./package.json');


var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/', {expose:'muzzley-client'});

js.add('./lib/dist-browser.js');

js.bundle(function(err, file){

  var fileName;
  var minified = UglifyJS(file);
  fs.mkdirSync('dist');

  fileName = __dirname + '/dist/muzzley-client-' + version.version + '.js';
  fs.writeFileSync(fileName, file);
  console.log('It\'s saved and ready to use at ' + fileName);

  fileName = __dirname + '/dist/muzzley-client-' + version.version + '.min.js';
  fs.writeFileSync(fileName, minified);
  console.log('It\'s saved and ready to use at ' + fileName);

  console.log("");
  console.log("Check examples folder to find more about how to use the lib");

});
