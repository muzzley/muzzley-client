var lib = require('muzzley-sdk-js');

var options = {
  socket: SockJS,
  endPoint:'http://platform.geo.muzzley.com/web'
};

muzzley = (function(lib, options){
  var muzz = function() {};

  muzz.prototype.createActivity = function(opts, callback){
    var muzzleyConnection = new lib(options);
    muzzleyConnection.createActivity(opts, callback);
  };

  muzz.prototype.joinActivity = function(userToken, activityId, callback){
    var muzzleyConnection = new lib(options);
    muzzleyConnection.joinActivity(userToken, activityId, callback);
  };

  return new muzz();
})(lib, options);




