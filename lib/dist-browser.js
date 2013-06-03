var Eventify = require('eventify');
var muzzleySDK = require('muzzley-client');
var errors = require('./utils/error-browser.js');

var options = {
  socket: SockJS,
  endPoint:'http://localhost:8082/web'
  //endPoint:'http://platform.geo.muzzley.com/web'
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
    var _this = this;
    var muzzleyConnection = new muzzleySDK(options);
    muzzleyConnection.connectApp(opts, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(error){
      if (error.error === 'Timeout'){
        errors.sendError(error);
      }else if (error.d && error.d.connectTo){
        errors.sendError(error);
      }
      _this.trigger('error', error);
    });

    muzzleyConnection.on('disconnect', function(err){
      _this.trigger('disconnect', err);
    });
  };



  var returnValue = new muzz();
  //Enable events on the module
  Eventify.enable(returnValue);
  return returnValue;

})(muzzleySDK, options);




