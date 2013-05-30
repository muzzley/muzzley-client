var ws = require('ws');
var muzzley = require('./index.js');
var Eventify = require('eventify');
var errors = require('./utils/error-node.js');


//Enable events on the module
Eventify.enable(module.exports);


var options = {
  socket: ws,
  endPoint:'ws://platform.geo.muzzley.com/ws'
  //endPoint:'ws://localhost:8081/ws'
};



module.exports.connectApp = function(opts, callback){
  var muzzleyConnection = new muzzley(options);
  muzzleyConnection.connectApp(opts, callback);
  //Bubble error up
  muzzleyConnection.on('error', function(err){
    errors.sendError(err);
    console.log(err);
  });

  muzzleyConnection.on('disconnect', function(err){
    module.exports.trigger('disconnect', err);
  });
};

module.exports.connectUser = function(userToken, activityId, callback){
  var muzzleyConnection = new muzzley(options);
  muzzleyConnection.joinActivity(userToken, activityId, callback);
  //Bubble error up
  muzzleyConnection.on('error', function(err){
    module.exports.trigger('error', err);
  });

};

module.exports.instance = muzzley;
//module.exports = muzzleyConnection;
