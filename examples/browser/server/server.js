
/*
*   Compile the lib from source to "./lib"
*
*/
var fs = require('fs');
var UglifyJS = require("uglify-js");
var browserify = require('browserify');
var version = require('../../../package.json');

var port = process.env.PORT || 3000;
var exampleUrl = 'http://localhost:'+port+'/app.html';

var js = browserify(['../../../vendor/sockjs.js', 'debug']);
js.require('../../../lib/', {expose:'muzzley-client'});

js.add('../../../lib/dist-browser.js');

js.bundle(function(err, file){
  if (err){
    return console.log('Oops. Something just went wrong. Error:', err);
  }

  var fileName;
  var minified = UglifyJS(file);

  fileName = __dirname + '/../lib/muzzley-client-' + version.version + '.js';
  fs.writeFileSync(fileName, file);

  // Start the server
  app.listen(port, function () {
    console.log('The examples should be running at ' + exampleUrl);
  });

});


/*
*   Configure a express http server to serve the lib browser examples"
*
*/
var clientMiddleware = require('browserify-middleware');

var express = require('express');
var app = express();

app
  .use(express.static('../html'))
  .use(express.static('../lib'));


app.get('/', function (req, res) {
  res.send('Go to <a href="' + exampleUrl + '">'+exampleUrl+'</a> to see an example.');
});