var Eventify                = require('eventify');
var compose                 = require('./utils/compose');


//midlewares
var IdlingMonitor           = require('./middleware/IdlingMonitor');
var hb                      = require('./middleware/heartBeat');
var playerJoin              = require('./middleware/activity/playerJoin')();
var playerAction            = require('./middleware/activity/playerAction');
var playerQuit              = require('./middleware/activity/playerQuit');
var btnA                    = require('./middleware/activity/btnA');
var activityTerminated      = require('./middleware/participant/activityTerminated');
var transformControl        = require('./middleware/participant/transformControl');
var setupComponent          = require('./middleware/participant/setupComponent');

var fileShareInvite         = require('./middleware/fileShare').fileShareInvite;
var receiveFile             = require('./middleware/fileShare').receiveFile;
var sharingEnd              = require('./middleware/fileShare').sharingEnd;
var sharingCancel           = require('./middleware/fileShare').sharingCancel;

var mediaStream             = require('./middleware/mediaStream');
var signalingMessage        = require('./middleware/signalingMessage');

var RpcManager              = require('./rpcManager/RpcManager');
var RemoteCalls             = require('./remoteCalls/RemoteCalls');

var errorSender = null;
var socket = null;
var path = null;
var schemas = null; // { secure: '', insecure: '' }

var insecurePorts = [80, 2080];
var securePorts = [443];

//models
var User = require('./models/User');

var TYPE_APP = 'app';
var TYPE_USER = 'user';

/**
 * The Muzzley client constructor.
 * 
 * Emits the following events:
 * - `connect`: Fired upon a successful connection.
 * - `connectError`: Fired upon a connection error. Parameters: Object error object
 * - `connectTimeout`: Fired upon a connection timeout.
 * - `reconnect`: Fired upon a successful reconnection. Parameters: Number reconnection attempt number
 * - `reconnectAttempt`: Fired upon a reconnection attempt.
 * - `reconnectError`: Fired upon a reconnection attempt error. Parameters: Object error object
 * - `reconnectFailed`: Fired upon a reconnection attempt
 * 
 * @param {object} options The following parameters are allowed (and heavily inspired by socket.io):
 *                         - secure: Whether to use SSL. Optional. Boolean. Default: false.
 *
 *                         - sendErrors: Boolean indicating whether network errors should be logged remotely. Default: true.
 *                         - connectTimeout: After how many milliseconds is a connection attempt aborted.
 *                           Default: 15000.
 *                         - reconnect: Whether to reconnect on connection error. Boolean. Default: true.
 *                         - reconnectionDelay: The initial timeout to start a reconnect,
 *                           this is increased using an exponential back off algorithm each time a
 *                           new reconnection attempt has been made.
 *                           Default: 500.
 *                         - reconnectionLimit: The maximum reconnection delay in
 *                           milliseconds, or Infinity. Default: 300000 (5 min).
 *                         - reconnectionAttempts: How many times should we attempt to reconnect
 *                           with the server after a a dropped connection.
 *                           After this we will emit the reconnectFailed event.
 *                           Default: Infinity.
 *                         - idleTimeout: Internal. You should not need to use this.
 *                           Defines how much time in milliseconds after the last
 *                           received message we consider that the connection has died.
 *                           Default: 60000.
 *                         - connection: Internal parametrization of the connection itself. Optional.
 *                            - socket: Internal. A websocket-compatible client such as SockJS or einaros/ws.
 *                            - schema: Internal. The connection schema such as http or ws.
 *                            - host: Internal. The host to connect to.
 *                            - port: Internal. A single port or an array with ports.
 *                            - path: Internal. The URI to which to connect to.
 * 
 * 
 */
function MuzzleyClient (options) {
  if (!socket) {
    throw new Error('No socket implementation defined.');
  }
  if (!path) {
    throw new Error('No path URI defined.');
  }

  Eventify.enable(this);

  var self = this;
  options = options || {};
  options.connection = options.connection || {};

  this.socket = options.connection.socket || socket;
  this.endPointHost = options.connection.host || 'geoplatform.muzzley.com';
  this.endPointPath = options.connection.path || path;

  // Use SSL (https, wss)?
  this.secure = (typeof options.secure !== undefined) ? options.secure : false;
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
    // If we're in a browser and we're loaded through HTTPS we have to force it
    this.secure = true;
  }

  if (options.connection.schema) {
    this.endPointSchema = options.connection.schema;
  } else {
    this.endPointSchema = this.secure ? schemas.secure : schemas.insecure;
  }

  if (options.connection.port) {
    this.ports = options.connection.port instanceof Array ? options.connection.port : [options.connection.port];
  } else {
    this.ports = this.secure ? securePorts : insecurePorts;
  }
  this.curPortIndex = 0; // ports[0] = 80

  this.manualReady = (typeof options.manualReady !== 'undefined') ? options.manualReady : false;

  // The connection maintenance settings.
  this.maintenance = {
    connectTimeout: options.connectTimeout || 15000,
    reconnect: (typeof options.reconnect === 'boolean') ? options.reconnect : true,
    reconnectionDelay: options.reconnectionDelay || 500,
    reconnectionLimit: options.reconnectionLimit || 300000,
    reconnectionAttempts: (typeof options.reconnectionAttempts !== 'undefined') ? options.reconnectionAttempts : Infinity
  };

  this.clearReconnectionStatus();

  var idlingOptions = { idleTime: options.idleTimeout || 60000 };
  this.idlingMonitor = new IdlingMonitor(idlingOptions);
  this.idlingMonitor.on('idle', function (options) {
    self.idlingMonitor.stop();
    self.trigger('error', new Error('Connection is idle'));
    self.trigger('disconnect');
    self.maybeReconnect();
  });
  this.idlingMonitor.on('message', function (message) {
    self.trigger('debug', { type: 'message-in', message: message });
  });

  this.doSendErrors = (typeof options.sendErrors === 'boolean') ? options.sendErrors : true;
  this.on('error', function (error) {
    if (typeof errorSender !== 'function' || !self.doSendErrors) return;
    if (error.code === 'ETIMEOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      var lastEndpoint = self.getEndPoint({noDebug: true});
      errorSender({code: error.code, message: error.message, endpoint: lastEndpoint}, self.secure);
    }
  });

  this.participants = {};
  this.activity = null;
  this._user = null;

  var sendFunction = this.__send.bind(this);
  this.rpcManager = new RpcManager({ send: sendFunction });
  this.remoteCalls = new RemoteCalls({ send: sendFunction, rpcManager: this.rpcManager });
}

Eventify.enable(MuzzleyClient);

/**
 * Allows overriding the default lib parameters.
 *
 * @param  {object} options The following params can be configured:
 *                          - `socket`: Object. Which websocket implementation to use. Either `ws` or `SockJS`.
 *                          - `schemas`: Object with the secure and insecure schemas. Ex: { secure: 'https', insecure: 'http'}
 *                          - `path`:   String. The URI to connect to.
 *                                      For browsers it should be /ws, for native implementations: ''
 *                          - `errorSender`: A function that sends eventually logs network errors.
 * @return {undefined}
 */
MuzzleyClient.config = function (options) {
  options = options || {};
  if (options.socket) {
    socket = options.socket;
  }
  if (options.path) {
    path = options.path;
  }
  if (options.schemas) {
    schemas = options.schemas;
  }
  if (options.errorSender) {
    errorSender = options.errorSender;
  }
};

/**
 * Whether to log network errors remotely.
 * 
 * @param  {boolean} value
 * @return {undefined}
 */
MuzzleyClient.prototype.sendErrors = function (value) {
  this.doSendErrors = value;
};

MuzzleyClient.prototype.__send = function (message) {
  var msg = message;
  if (typeof message === 'object') {
    msg = JSON.stringify(message);
  }
  
  this.trigger('debug', { type: 'message-out', message: msg });
  this._socket.send(msg);
};

MuzzleyClient.prototype.__getMiddleware = function (type) {
  var middlewareFunctions = [];
  if (type === TYPE_USER) {
    middlewareFunctions.push(this.idlingMonitor.middleware);
    middlewareFunctions.push(hb);
    middlewareFunctions.push(this.rpcManager.handleResponse.bind(this.rpcManager));
    middlewareFunctions.push(transformControl);
    middlewareFunctions.push(setupComponent);
    middlewareFunctions.push(activityTerminated);
    middlewareFunctions.push(fileShareInvite);
    middlewareFunctions.push(receiveFile);
    middlewareFunctions.push(sharingEnd);
    middlewareFunctions.push(sharingCancel);
    middlewareFunctions.push(signalingMessage);
  }

  if (type === TYPE_APP) {

    middlewareFunctions = [];
    middlewareFunctions.push(this.idlingMonitor.middleware);
    middlewareFunctions.push(hb);
    middlewareFunctions.push(this.rpcManager.handleResponse.bind(this.rpcManager));
    middlewareFunctions.push(playerJoin);
    middlewareFunctions.push(playerAction);
    middlewareFunctions.push(playerQuit);
    middlewareFunctions.push(fileShareInvite);
    middlewareFunctions.push(receiveFile);
    middlewareFunctions.push(sharingEnd);
    middlewareFunctions.push(sharingCancel);
    middlewareFunctions.push(mediaStream);
    middlewareFunctions.push(signalingMessage);
  }
  return middlewareFunctions;
};

function processQuit(muzzleyClient, callback) {
  muzzleyClient.idlingMonitor.stop();
  muzzleyClient.remoteCalls.quit(function(err, data) {
    try {muzzleyClient._socket.close();} catch (e) {}

    muzzleyClient.trigger('disconnect');

    if (typeof callback !== 'function') return;

    if (err) return callback(err);
    if (data && data.s === true) {
      return callback(null, true);
    }
    return callback(null, false);
  });
}

MuzzleyClient.prototype.switchPort = function(){
  this.curPortIndex = (this.curPortIndex + 1) % this.ports.length;
};

MuzzleyClient.prototype.getEndPoint = function(options){
  var endPoint;
  // options: { port, host, schema, path, noDebug }
  options = options || {};
  if (typeof schema === 'string' && schema.length) {
    endPoint = schema + '://';
  } else if (typeof this.endPointSchema === 'string' && this.endPointSchema.length) {
    endPoint = this.endPointSchema + '://';
  } else {
    // Used for browser clients. Let it choose between http and https
    endPoint = '//';
  }
  endPoint += options.host || this.endPointHost;
  endPoint += ':';
  endPoint += options.port || this.ports[this.curPortIndex];
  endPoint += options.path || this.endPointPath;
  if (!options.noDebug) {
    this.trigger('debug', { type: 'endpoint', message: 'Current connection URL: ' + endPoint});
  }
  return endPoint;
};

MuzzleyClient.prototype.maybeReconnect = function () {
  var self = this;

  if (this.reconnecting) return this;

  if (!this.reconnectOptions) {
    throw new Error('Cannot reconnect. Reconnect options not defined.');
  }
  try {this._socket.close();} catch (e) {}

  if (!this.maintenance.reconnect) {
    this.trigger('debug', { type: 'reconnect', message: 'Reconnect is disabled. Not reconnecting.'});
    this.clearReconnectionStatus();
    return;
  }

  var curAttempt = ++this.reconnectionStatus.attempt;

  if (curAttempt > this.maintenance.reconnectionAttempts) {
    this.trigger('debug', { type: 'reconnect', message: 'Reconnect failed after ' + (curAttempt - 1) + ' attempts' });
    this.trigger('reconnectFailed');
    this.clearReconnectionStatus();
    return;
  }

  var curDelay = this.maintenance.reconnectionDelay * curAttempt;
  curDelay = Math.min(curDelay, this.maintenance.reconnectionLimit);
  this.trigger('debug', { type: 'reconnect', message: 'Reconnection attempt ' + curAttempt + ' with a delay of ' + curDelay + 'ms'});

  this.reconnecting = true;
  this.reconnectTimeout = setTimeout(function () {
    self.trigger('debug', { type: 'reconnect', message: 'Attempting reconnect now'});
    self.trigger('reconnectAttempt', curAttempt);

    self.__connectCommon(
      self.reconnectOptions.type,
      self.reconnectOptions.options,
      self.reconnectOptions.callback
    );
  }, curDelay);
};

/*
*   Main function that connects you to muzzley as a app
*
*/
MuzzleyClient.prototype.connectApp = function(options, callback){
  this.__connectCommon(TYPE_APP, options, callback);
};

MuzzleyClient.prototype.connectUser = function(options, callback){
  this.__connectCommon(TYPE_USER, options, callback);
};

MuzzleyClient.prototype.__connectCommon = function(type, options, callback) {
  var self = this;
  callback = callback || function () {};

  var TIMEOUT = this.maintenance.connectTimeout;
  var connectionTimeout;
  
  this.reconnectOptions = {
    type: type,
    options: JSON.parse(JSON.stringify(options)),
    callback: callback
  };

  var onopen = function()  {
    clearTimeout(connectionTimeout);
    self.idlingMonitor.start();

    var middlewareFunctions = self.__getMiddleware(type);
    self.runMiddlewares = compose.apply(this, middlewareFunctions);

    handshake();

    function handshake() {
      self.remoteCalls.handshake(options, function (err, muzzData){
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }
        authenticate();
      });
    }

    function authenticate() {
      var authFunction;
      var nextStep;
      if (type === TYPE_USER) {
        authFunction = self.remoteCalls.authUser.bind(self.remoteCalls);
        nextStep = joinActivity;
      } else {
        authFunction = self.remoteCalls.loginApp.bind(self.remoteCalls);
        nextStep = createActivity;
      }

      authFunction(options, function (err, muzzData) {
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }
        nextStep();
      });
    }

    function createActivity() {
      self.remoteCalls.createActivity(options, function(err, muzzData){
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }

        if (muzzData.d && muzzData.d.connectTo) {
          //We're being redirected
          self.endPointHost = muzzData.d.connectTo;
          try {self._socket.close();} catch (e) {}
          connect(self.ports.length);
          return;
        }

        if (self.activity) {
          // Reuse and update the existing activity object
          self.activity.activityId = muzzData.d.activityId;
          self.activity.qrCodeUrl = muzzData.d.qrCodeUrl;
        } else {
          //Create a new activity object
          var activity = {
            quit: function (callback) {
              processQuit(self, callback);
            },
            activityId: muzzData.d.activityId,
            qrCodeUrl: muzzData.d.qrCodeUrl
          };
          Eventify.enable(activity);
          self.activity = activity;
        }

        if (self.reconnecting) {
          self.onreconnect();
        } else {
          self.trigger('connect', self.activity);
          if (callback){
            callback(null, self.activity);
          }
        }
      });
    }

    function joinActivity() {
      self.remoteCalls.joinActivity(options.activityId, function (err, muzzData) {
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }

        if (muzzData.d && muzzData.d.connectTo) {
          // We're being redirected
          self.endPointHost = muzzData.d.connectTo;
          try {self._socket.close();} catch (e) {}
          return connect(self.ports.length);
        }

        // Copy all the properties of the user dynamically
        var userProps = {};
        for(var key in muzzData.d.participant) {
          userProps[key] = muzzData.d.participant[key];
        }
        userProps._remoteCalls = self.remoteCalls;


        var user = null;
        if (self._user) {
          // Reuse and update the user's properties
          user = self._user;
          user.updateProperties(userProps);
        } else {
          // Create a new user object
          user = new User(userProps);
          // Once the user quits, close her socket connection.
          user.on('quitPerformed', function () {
            self.idlingMonitor.stop();
            try {self._socket.close();} catch (e) {}
            self._user = null;
          });
          self._user = user;
        }

        if (self.manualReady) {
          // The user wants to send the 'ready' protocol message himself
          if (self.reconnecting) {
            self.onreconnect();
          } else {
            self.trigger('connect', user);
            self.trigger('joined', user); // Backwards compatible alias
            if (callback) {
              return callback(null, user);
            }
          }
        } else {
          // The default is to abstract the Send Ready event to activity
          self.remoteCalls.sendReady(function (err, muzzData){
            if (self.reconnecting) {
              self.onreconnect();
            } else {
              self.trigger('connect', user);
              self.trigger('joined', user); // Backwards compatible alias
              if (callback) {
                return callback(null, user);
              }
            }

          });
        }
      });
    }
  
  }; // onopen

  var onmessage = function(message) {
    self.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  function retryConnect(remainingAttempts) {
    if (remainingAttempts <= 0) {
      self.reconnecting = false;
      self.maybeReconnect();
      return;
    }
    self.switchPort();
    connect(--remainingAttempts);
  }

  function connect(remainingAttempts) {
    // Connection Timeout
    connectionTimeout = setTimeout(function () {
      // Close the socket immediatelly so that it does
      // not have a chance to connect later or we'll have race conditions.
      try {self._socket.close();} catch (e) {}

      var timeoutError = new Error('Connect timeout');
      timeoutError.code = 'ETIMEOUT';
      self.trigger('error', timeoutError);
      self.trigger('connectTimeout', TIMEOUT);
      retryConnect(--remainingAttempts);
    }, TIMEOUT);

    self._socket = new self.socket(self.getEndPoint());

    self._socket.onclose = function onclose() {
      
    };

    self._socket.onerror = function onerror(error)  {
      clearTimeout(connectionTimeout);
      if (self.reconnecting) {
        self.trigger('reconnectError', error);
      }
      self.trigger('connectError', error);
      retryConnect(--remainingAttempts);
    };
    self._socket.onopen = onopen;
    self._socket.onmessage = onmessage;
  }

  // First connection attempt with the current
  // connection (host, port, ...) settings
  connect(self.ports.length);
  
};

MuzzleyClient.prototype.clearReconnectionStatus = function () {
  this.reconnecting = false;
  this.reconnectionStatus = {
    reconnectionDelay: 0,
    attempt: 0
  };
};

MuzzleyClient.prototype.onreconnect = function () {
  this.trigger('reconnect', this.reconnectionStatus.attempt);
  this.clearReconnectionStatus();
};

module.exports = MuzzleyClient;
