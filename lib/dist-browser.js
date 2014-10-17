var Eventify = require('eventify');
var MuzzleySdk = require('muzzley-client');
var errorSender = require('./utils/error-browser.js');

MuzzleySdk.config({
  socket: SockJS,
  path: '/web',
  schemas: { secure: 'https', insecure: 'http' },
  errorSender: errorSender
});

Muzzley = muzzley = (function(MuzzleySdk){

  //console.log fallback to prevent errors
  if (!window.console) {
    window.console = {
      log: function() {}
    };
  }

  // -------------------------------
  // Legacy connection setup support
  // -------------------------------
  // @deprecated Create an instance of the Muzzley object and call `connectApp` on it.
  MuzzleySdk.connectApp = function (opts, callback) {
    var self = this;

    var options;
    if (typeof opts === 'object') {
      options = opts;
    } else {
      // Just a string (app token) was provided
      options = {
        token: opts
      };
    }

    var muzzleyConnection = new MuzzleySdk(options);

    // Make the actual connection process async so that we can
    // immediatelly return the muzzley instance below.
    setTimeout(function () {
      muzzleyConnection.connectApp(options, callback);
    }, 0);
    return muzzleyConnection;
  };

  // -------------------------------
  // Legacy connection setup support
  // -------------------------------
  // @deprecated Create an instance of the Muzzley object and call `connectUser` on it.
  MuzzleySdk.connectUser = function (userToken, activityId, callback) {
    var self = this;

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

    var muzzleyConnection = new MuzzleySdk(options);
    // Make the actual connection process async so that we can
    // immediatelly return the muzzley instance below.
    setTimeout(function () {
      muzzleyConnection.connectUser(options, callback);
    }, 0);
    return muzzleyConnection;
  };

  return MuzzleySdk;
  
})(MuzzleySdk);
