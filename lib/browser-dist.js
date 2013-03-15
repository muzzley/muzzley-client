var Eventify = require('eventify');
var muzzleySDK = require('muzzley-sdk-js');

var options = {
  socket: SockJS,
  endPoint:'http://platform.geo.muzzley.com/web'
};

muzzley = (function(muzzleySDK, options){
  var muzz = function() {};

  if (!window.console) {
    window.console = {
      log : function() {}
    };
  }

  muzz.prototype.createActivity = function(opts, callback){
    var muzzleyConnection = new muzzleySDK(options);
    muzzleyConnection.createActivity(opts, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(err){
      muzz.trigger('error', err);
    });

  };

  muzz.prototype.joinActivity = function(userToken, activityId, callback){
    var muzzleyConnection = new muzzleySDK(options);
    muzzleyConnection.joinActivity(userToken, activityId, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(err){
      muzz.trigger('error', err);
    });

  };

  var returnValue = new muzz();
  //Enable events on the module
  Eventify.enable(returnValue);
  return returnValue;

})(muzzleySDK, options);




