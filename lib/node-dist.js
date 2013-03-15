var ws = require('ws');
var muzzley = require('./index.js');
var Eventify = require('eventify');

//Enable events on the module
Eventify.enable(module.exports);


var options = {
  socket: ws,
  endPoint:'ws://platform.geo.muzzley.com/ws'
};


module.exports.createActivity = function(opts, callback){
  var muzzleyConnection = new muzzley(options);
  muzzleyConnection.createActivity(opts, callback);
  //Bubble error up
  muzzleyConnection.on('error', function(err){
    module.exports.trigger('error', err);
  });

};

module.exports.joinActivity = function(userToken, activityId, callback){
  var muzzleyConnection = new muzzley(options);
  muzzleyConnection.joinActivity(userToken, activityId, callback);
  //Bubble error up
  muzzleyConnection.on('error', function(err){
    module.exports.trigger('error', err);
  });

};

module.exports.instance = muzzley;
//module.exports = muzzleyConnection;
