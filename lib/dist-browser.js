var Eventify = require('eventify');
var MuzzleySdk = require('muzzley-client');
var errors = require('./utils/error-browser.js');

var defaultOptions = {
  socket: SockJS,
  // Leave empty to use '//' so that the browser can choose between http and https
  endPointHost:'geoplatform.muzzley.com',
  endPointPath: 'web'
};

var getConnectionOptions = function(opts) {
  // http or https?
  var secure = (opts && typeof opts.secure !== undefined) ? opts.secure : false;
  if (window && window.location && window.location.protocol === 'https:') {
    // If we're in a browser and we're loaded through HTTPS
    secure = true;
  }

  var connectionOptions = {
    socket: (opts && opts.connection && opts.connection.socket) ? opts.connection.socket : defaultOptions.socket,
    secure: secure,
    endPointSchema: secure ? 'https' : 'http',
    endPointHost: (opts && opts.connection && opts.connection.endPointHost) ? opts.connection.endPointHost : defaultOptions.endPointHost,
    endPointPath: (opts && opts.connection && opts.connection.endPointPath) ? opts.connection.endPointPath : defaultOptions.endPointPath
  };

  return connectionOptions;
};

muzzley = (function(MuzzleySdk, options){
  var muzz = function() {};

  //console.log fallback to prevent errors
  if (!window.console) {
    window.console = {
      log : function() {}
    };
  }

  muzz.prototype.connectApp = function(opts, callback){
    var _this = this;

    var connectionOptions = getConnectionOptions(options);

    var muzzleyConnection = new MuzzleySdk(connectionOptions);
    muzzleyConnection.connectApp(opts, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(error){
      if (error.error === 'Timeout') {
        if(_this.sendErrors){
          errors.sendError(error, muzzleyConnection.secure);
        }
      }
      _this.trigger('error', error);
    });

    muzzleyConnection.on('disconnect', function(err){
      _this.trigger('disconnect', err);
    });
  };

  muzz.prototype.connectUser = function(userToken, activityId, callback){
    var _this = this;

    _this.secure = connectionOptions.secure;

    var options;
    if (arguments.length === 2 && typeof userToken === 'object') {
      options = userToken;
      callback = activityId;
    } else {
      // Transform the two arguments into the options object format
      options = {
        token: userToken,
        activityId: activityId
      };
    }

    var connectionOptions = getConnectionOptions(options);

    var muzzleyConnection = new MuzzleySdk(options);
    muzzleyConnection.connectUser(userToken, activityId, callback);

    //Bubble error up
    muzzleyConnection.on('error', function(error){
      if (error.error === 'Timeout') {
        if(_this.sendErrors){
          errors.sendError(error, muzzleyConnection.secure);
        }
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

  returnValue.sendErrors = true;

  return returnValue;

})(MuzzleySdk, defaultOptions);
