/*
*   Compile the lib from source to "./lib"
*
*/
var fs = require('fs');
var UglifyJS = require("uglify-js");
var browserify = require('browserify');
var version = require('../../package.json');

var js = browserify(['../../vendor/sockjs.js']);
js.require('../../lib/', {expose:'muzzley-client'});

js.add('../../lib/dist-browser.js');

js.bundle(function(err, file){

  if (err){
    console.log('something wrong appened when compiling the lib:');
    console.log(err);
  } else {
    var fileName;
    var minified = UglifyJS(file);

    fileName = __dirname + '/lib/muzzley-client-' + version.version + '.js';
    fs.writeFileSync(fileName, file);

    console.log('It\'s compiled and ready to use at http://localhost:3000/simple.html');

    //Start the server
    app.listen(3001);
  }
});


/*
*   Configure a express http server to serve the lib browser examples"
*
*/

var express = require('express');
var app = express();

app
  .use(express.static('./html'))
  .use(express.static('./lib'));

app.get('/', function (req, res) {
  res.send('This is a demo! you shloud open http://localhost:3000/simple.html to see something');
});



