var ws = require('ws');
var muzzley = require('./index.js');

var options = {
  socket: ws,
  uri:'ws://platform.geo.muzzley.com/ws'
};


module.exports.createActivity = function(opts, callback){
  var muzzleyConnection = new muzzley(options);
  muzzleyConnection.createActivity(opts, callback);
};

module.exports.instance = muzzley;
//module.exports = muzzleyConnection;
