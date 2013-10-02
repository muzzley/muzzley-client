var ws = require('ws');
var Muzzley = require('./index.js');
var Eventify = require('eventify');
var errors = require('./utils/error-node.js');

//Enable events on the module
Eventify.enable(module.exports);

var defaultOptions = {
  socket: ws,
  endPointHost:'geoplatform.muzzley.com',
  endPointPath: 'ws'
};

var getConnectionOptions = function(opts) {
  // ws or wss?
  var secure = (opts && typeof opts.secure !== undefined) ? opts.secure : false;
  var manualReady = (opts && typeof opts.manualReady !== undefined) ? opts.manualReady : false;

  var connectionOptions = {
    socket: (opts && opts.connection && opts.connection.socket) ? opts.connection.socket : defaultOptions.socket,
    secure: secure,
    endPointSchema: secure ? 'wss' : 'ws',
    endPointHost: (opts && opts.connection && opts.connection.endPointHost) ? opts.connection.endPointHost : defaultOptions.endPointHost,
    endPointPath: (opts && opts.connection && opts.connection.endPointPath) ? opts.connection.endPointPath : defaultOptions.endPointPath,
    manualReady: manualReady
  };

  return connectionOptions;
};

/**
 * Supported ways to call this function:
 * - connectApp('appToken', function)
 * - connectApp({token: 'appToken'}, function)
 * - connectApp({token: 'appToken', activityId: 'static activity id'}, function)
 *
 * @param {string|options} opts The Muzzley application token string or an object of options.
 *                              Supported params:
 *                              - token: A string with the Muzzley application token
 *                              - activityId: A static activity id for apps that have them configured at muzzley.com.
 * @param {function} callback
 */
module.exports.connectApp = function(options, callback){

  var connectionOptions = getConnectionOptions(options);

  var muzzleyConnection = new Muzzley(connectionOptions);
  muzzleyConnection.connectApp(options, callback);

  //Bubble error up
  muzzleyConnection.on('error', function(error){
    if (error.error === 'Timeout' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      if (module.exports.sendErrors){
        errors.sendError(error, muzzleyConnection.secure);
      }
    }
  });

  muzzleyConnection.on('disconnect', function(err){
    module.exports.trigger('disconnect', err);
  });
};


/**
 * Supported ways to call this function:
 * - connectUser('userToken', 'activityId' function)
 * - connectUser({token: 'userToken', activityId: 'activity id to join'}, function)
 *
 * @param {string|options} userToken The Muzzley application token string or an object of options.
 *                                   Supported params:
 *                                   - token: A string with the Muzzley application token
 *                                   - activityId: A static activity id for apps that have them configured at muzzley.com.
 * @param {function} callback
 */
module.exports.connectUser = function(userToken, activityId, callback){

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

  var muzzleyConnection = new Muzzley(connectionOptions);
  muzzleyConnection.connectUser(options, callback);

  //Bubble error up
  muzzleyConnection.on('error', function(err){
    module.exports.trigger('error', err);
  });

};

module.exports.sendErrors = true;
module.exports.instance = Muzzley;
