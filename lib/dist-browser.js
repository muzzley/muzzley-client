var Eventify = require('eventify');
var muzzleySDK = require('muzzley-sdk-js');

var options = {
  socket: SockJS,
  endPoint:'http://platform.geo.muzzley.com/web'
};

muzzley = (function(muzzleySDK, options){
  var muzz = function() {};

  //Console.log fallback to prevent errors
  if (!window.console) {
    window.console = {
      log : function() {}
    };
  }

  muzz.prototype.connectApp = function(opts, callback){
    var muzzleyConnection = new muzzleySDK(options);
    muzzleyConnection.connectApp(opts, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(err){
      muzz.trigger('error', err);
    });

    muzzleyConnection.on('disconnect', function(err){
      muzz.trigger('disconnect', err);
    });
  };



  var returnValue = new muzz();
  //Enable events on the module
  Eventify.enable(returnValue);
  return returnValue;

})(muzzleySDK, options);



