var ws = require('ws');
var muzzley = require('./index.js');

var options = {
  socket: ws,
  uri:'ws://platform.geo.muzzley.com:80/ws'
};

var muzzleyConnection = new muzzley(options);

module.exports = muzzleyConnection;
