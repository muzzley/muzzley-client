var ws = require('ws');
var Muzzley = require('./index.js');
var Eventify = require('eventify');
var errorSender = require('./utils/error-node.js');

Muzzley.config({
  socket: ws,
  path: '/ws',
  schemas: { secure: 'wss', insecure: 'ws' },
  errorSender: errorSender
});

/**
 * Supported ways to call this function:
 * - connectApp('appToken', function)
 * - connectApp({token: 'appToken'}, function)
 * - connectApp({token: 'appToken', activityId: 'static activity id'}, function)
 *
 * @deprecated Create an instance of the Muzzley object and call `connectApp` on it.
 * 
 * @param {string|options} opts The Muzzley application token string or an object of options.
 *                              Supported params:
 *                              - token: A string with the Muzzley application token
 *                              - activityId: A static activity id for apps that have them configured at muzzley.com.
 * @param {function} callback
 */
Muzzley.connectApp = function (options, callback) {

  var muzzleyConnection = new Muzzley(options);
  process.nextTick(function () {
    muzzleyConnection.connectApp(options, callback);
  });
  return muzzleyConnection;
};


/**
 * Supported ways to call this function:
 * - connectUser('userToken', 'activityId' function)
 * - connectUser({token: 'userToken', activityId: 'activity id to join'}, function)
 *
 * @deprecated Create an instance of the Muzzley object and call `connectUser` on it.
 * 
 * @param {string|options} userToken The Muzzley application token string or an object of options.
 *                                   Supported params:
 *                                   - token: A string with the Muzzley application token
 *                                   - activityId: A static activity id for apps that have them configured at muzzley.com.
 * @param {function} callback
 */
Muzzley.connectUser = function (userToken, activityId, callback) {

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

  var muzzleyConnection = new Muzzley(options);
  process.nextTick(function () {
    muzzleyConnection.connectUser(options, callback);
  });
  return muzzleyConnection;
};

exports = module.exports = Muzzley;