var browserify = require('browserify');
var fs = require('fs');
var ugly = require('uglify-js');
var http = require('http');
var ecstatic = require('ecstatic');
var sockjs = require('sockjs');



var js = browserify({
  watch: true,
  require: __dirname + '/lib/main.js'
});

fs.writeFile(__dirname + '/html/js/muzzley-sdk.js', js.bundle(), function (err) {
  if (err) throw err;
  console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-sdk.js');
});

var jsMin = browserify({
  watch: true,
  require: __dirname + '/lib/main.js',
  filter : require('uglify-js')
});

fs.writeFile(__dirname + '/html/js/muzzley-sdk.min.js', jsMin.bundle(), function (err) {
  if (err) throw err;
  console.log('It\'s saved! and ready to use on: ' + __dirname + '/html/js/muzzley-sdk.min.js');
});

var server = http.createServer(
  ecstatic({ root: __dirname + '/html' })
).listen(8081);

echo = sockjs.createServer();

echo.installHandlers(server, {prefix:'/ws'});

echo.on('connection', function(conn) {
    conn.on('data', function(message) {
      console.log(message);
      conn.write(message);
    });
    conn.on('close', function() {});
});
