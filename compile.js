var fs = require('fs');
var UglifyJS = require("uglify-js");
var browserify = require('browserify');
var version = require('./package.json');


var js = browserify(['./vendor/sockjs.js']);
js.require('./lib/', {expose:'muzzley-sdk-js'});

js.add('./lib/browser-dist.js');

js.bundle(function(err, file){

  var fileName;
  var minified = UglifyJS(file);

  fileName = __dirname + '/dist/muzzley-client-' + version.version + '.js';
  fs.writeFileSync(fileName, file);
  console.log('It\'s saved and ready to use at ' + fileName);

  fileName = __dirname + '/dist/muzzley-client-' + version.version + '.min.js';
  fs.writeFileSync(fileName, minified);
  console.log('It\'s saved and ready to use at ' + fileName);

  fileName = __dirname + '/tests/public/muzzley-client-' + version.version + '.min.js';
  fs.writeFileSync(fileName, minified);
  console.log('\nTo test it run these commands:');
  console.log('1. Run "npm install" in the "tests/" folder');
  console.log('2. Run "node tests/testDist.js"');
  console.log('3. Open the link: http://localhost:8081/min.html (and check the console)');
});