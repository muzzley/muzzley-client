//Lib details
var version = '0.3.8';
var protocol = '1.2.0';

var Eventify                = require('eventify');
var compose                 = require('./utils/compose');

//RPCmanager
var RpcManager              = require('./rpcManager/rpcManager');

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

//remoteCalls
var activityRemoteCalls     = require('./remoteCalls/activity');
var participantRemoteCalls  = require('./remoteCalls/participant');


var socket = null;
var path = null;
var schemas = null; // { secure: '', insecure: '' }

var insecurePorts = [80, 2080];
var securePorts = [443];

//models
var User = require('./models/User');

//
// MAIN
//

/**
 * The Muzzley client constructor.
 * 
 * Emits the following events:
 * - `connect`: Fired upon a successful connection.
 * - `connect_error`: Fired upon a connection error. Parameters: Object error object
 * - `connect_timeout`: Fired upon a connection timeout.
 * - `reconnect`: Fired upon a successful reconnection. Parameters: Number reconnection attempt number
 * - `reconnect_attempt`: Fired upon a reconnection attempt.
 * - `reconnect_error`: Fired upon a reconnection attempt error. Parameters: Object error object
 * - `reconnect_failed`: Fired upon a reconnection attempt
 * 
 * @param {object} options The following parameters are allowed (and heavily inspired by socket.io):
 *                         - secure: Whether to use SSL. Optional. Boolean. Default: false.
 *
 *                         - connectTimeout: After how many milliseconds is a connection attempt aborted.
 *                           Default: 15000.
 *                         - reconnect: Whether to reconnect on connection error. Boolean. Default: true.
 *                         - reconnectionDelay: The initial timeout to start a reconnect,
 *                           this is increased using an exponential back off algorithm each time a
 *                           new reconnection attempt has been made.
 *                           Default: 500.
 *                         - reconnectionLimit: The maximum reconnection delay in
 *                           milliseconds, or Infinity. Default: Infinity.
 *                         - reconnectionAttempts: How many times should we attempt to reconnect
 *                           with the server after a a dropped connection.
 *                           After this we will emit the reconnect_failed event.
 *                           Default: 10.
 * 
 *                         - connection: Internal parametrization of the connection itself. Optional.
 *                            - socket: Internal. A websocket-compatible client such as SockJS or einaros/ws.
 *                            - schema: Internal. The connection schema such as http or ws.
 *                            - host: Internal. The host to connect to.
 *                            - ports: Internal. A single port or an array with ports.
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

  if (options.connection.ports) {
    this.ports = options.connection.ports instanceof Array ? options.connection.ports : [options.connection.ports];
  } else {
    this.ports = this.secure ? securePorts : insecurePorts;
  }

  this.curPortIndex = 0; // ports[0] = 80

  this.manualReady = (typeof options.manualReady !== undefined) ? options.manualReady : false;

  this.middleFunctions = [];
  this.participants = {};
  this._user = null;

  // The connection maintenance settings.
  this.maintenance = {
    connectTimeout: 15000,
    reconnect: true,
    reconnectionDelay: 500,
    reconnectionLimit: Infinity,
    reconnectionAttempts: 10,
  };

  this.reconnecting = false;

  this.clearReconnectionStatus();

  this.idlingMonitor = new IdlingMonitor({idleTime: 10000});
  this.idlingMonitor.on('idle', function (options) {
    console.log('======== THE CONNECTION HAS BECOME IDLE. OH NOES! Last Message Time: ' + new Date(options.lastMessageTime) + '. Reconnecting in 10s for debugging purposes!');
    setTimeout(function () {
      self.reconnect();
    }, self.maintenance.reconnectionDelay);
  });

  this.on('disconnect', function () {
    self.idlingMonitor.stop();
  });

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
 *
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
};

function processQuit(muzzleyClient, callback) {
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

MuzzleyClient.prototype.getEndPoint = function(port, host, schema, path){
  var endPoint;

  if (typeof schema === 'string' && schema.length) {
    endPoint = schema + '://';
  } else if (typeof this.endPointSchema === 'string' && this.endPointSchema.length) {
    endPoint = this.endPointSchema + '://';
  } else {
    // Used for browser clients. Let it choose between http and https
    endPoint = '//';
  }
  endPoint += host || this.endPointHost;
  endPoint += ':';
  endPoint += port || this.ports[this.curPortIndex];
  endPoint += path || this.endPointPath;
  this.trigger('debug', { type: 'endpoint', message: 'Current connection URL: ' + endPoint});
  return endPoint;
};

MuzzleyClient.prototype.reconnect = function () {
  var self = this;

  if (this.reconnecting) return this;

  if (!this.reconnectOptions) {
    throw new Error('Cannot reconnect. Reconnect options not defined.');
  }
  try {this._socket.close();} catch (e) {}

  var curAttempt = ++this.reconnectionStatus.attempt;

  if (curAttempt > this.maintenance.reconnectionAttempts) {
    this.trigger('debug', { type: 'reconnect', message: 'Reconnect failed after ' + curAttempt + ' attempts' });
    this.trigger('reconnect_failed');
    this.clearReconnectionStatus();
    return;
  }

  var curDelay = this.maintenance.reconnectionDelay * curAttempt;
  curDelay = Math.min(curDelay, this.maintenance.reconnectionLimit);
  this.trigger('debug', { type: 'reconnect', message: 'Reconnection attempt ' + curAttempt + ' with a delay of ' + curDelay + 'ms'});

  this.reconnecting = true;
  this.reconnectTimeout = setTimeout(function () {
    self.trigger('debug', { type: 'reconnect', message: 'Attempting reconnect now'});
    self.trigger('reconnect_attempt');
    if (self.reconnectOptions.type === 'user') {
      self.connectUser(self.reconnectOptions.options, self.reconnectOptions.callback);
    } else {
      self.connectApp(self.reconnectOptions.options, self.reconnectOptions.callback);
    }
  }, curDelay);
};

/**
 * Main function that connects you to muzzley as a Participant
 *
 */
MuzzleyClient.prototype.connectUser = function(options, callback){
  //remember this
  var self = this;

  var TIMEOUT = this.maintenance.connectTimeout;
  var connectionTimeout;

  if (typeof options !== 'object' || !options.token || !options.activityId) {
    throw new Error('Invalid parameters for connectUser()');
  }

  callback = callback || function () {};

  this.reconnectOptions = {
    connectionType: 'user',
    options: JSON.parse(JSON.stringify(options)),
    callback: callback
  };
  
  var onopen = function()  {

    console.log('CONNECTION OPEN!');
    clearTimeout(connectionTimeout);

    self.idlingMonitor.start();

    //Create rpcManager for this socket
    self.rpcManager = new RpcManager(self._socket);
    self.remoteCalls = new participantRemoteCalls(self._socket, self.rpcManager);

    //Configure default middlewares
    self.middleFunctions = [];
    self.middleFunctions.push(self.idlingMonitor.middleware);
    self.middleFunctions.push(hb);
    self.middleFunctions.push(self.rpcManager.handleResponse.bind(self.rpcManager));
    self.middleFunctions.push(transformControl);
    self.middleFunctions.push(setupComponent);
    self.middleFunctions.push(activityTerminated);
    self.middleFunctions.push(fileShareInvite);
    self.middleFunctions.push(receiveFile);
    self.middleFunctions.push(sharingEnd);
    self.middleFunctions.push(sharingCancel);
    self.middleFunctions.push(signalingMessage);

    self.runMiddlewares = compose.apply(this, self.middleFunctions);

    self.remoteCalls.handshake(options, function(err, muzzData){
      //If error return the error.
      if (err) {
        self.trigger('error', err);
        try {self._socket.close();} catch (e) {}
        return callback(err);
      }

      self.remoteCalls.authUser(options.token, function(err, muzzData){
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }

        self.remoteCalls.joinActivity(options.activityId, function(err, muzzData){
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

          var user = new User(userProps);

          // Once the user quits, close its socket connection.
          user.on('quitPerformed', function () {
            try {self._socket.close();} catch (e) {}
            self._user = null;
          });

          self._user = user;

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
              self.trigger('connect', user);
              self.trigger('joined', user); // Backwards compatible alias
              if (callback) {
                return callback(null, user);
              }
            });
          }

        });

      });
    });
  };

  var onmessage = function(message) {
    self.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  function retryConnect(remainingAttempts) {
    if (remainingAttempts <= 0) return;
    self.switchPort();
    connect(--remainingAttempts);
  }

  function connect(remainingAttempts) {
    // Connection Timeout
    connectionTimeout = setTimeout(function () {
      // Close the socket immediatelly so that it does
      // not have a chance to connect later or we'll have race conditions.
      try {self._socket.close();} catch (e) {}

      self.trigger('error', {error:'Timeout'});
      retryConnect(--remainingAttempts);
    }, TIMEOUT);

    self._socket = new self.socket(self.getEndPoint());

    self._socket.onclose = function onclose() {
      console.log('_____________ socket close', arguments);
    };

    self._socket.onerror = function onerror(error)  {
      console.log('_____________ socket error', error);
      //Clear conncetion timeout
      clearTimeout(connectionTimeout);
      self.trigger('error', error);
      retryConnect(--remainingAttempts);
    };
    self._socket.onopen = onopen;
    self._socket.onmessage = onmessage;
  }

  // First connection attempt with the current
  // connection (host, port, ...) settings
  connect(self.ports.length);

};


/*
*   Main function that connects you to muzzley as a app
*
*/
MuzzleyClient.prototype.connectApp = function(options, callback){
  //If no callback passed define an empty one
  if (typeof(callback) !== 'function') callback = function(){};
 
  var self = this;
  var TIMEOUT = this.maintenance.connectTimeout;
  var connectionTimeout;

  this.reconnectOptions = {
    connectionType: 'app',
    options: JSON.parse(JSON.stringify(options)),
    callback: callback
  };

  //On socket connection stablished
  var onopen = function()  {
    console.log('CONNECTION OPEN!');

    //Clear conncetion timeout
    clearTimeout(connectionTimeout);

    self.idlingMonitor.start();

    //create rpcManager for this socket
    self.rpcManager = new RpcManager(self._socket);
    self.remoteCalls = new activityRemoteCalls(self._socket, self.rpcManager);

    //Configure default middlewares
    self.middleFunctions = [];
    self.middleFunctions.push(self.idlingMonitor.middleware);
    self.middleFunctions.push(hb);
    self.middleFunctions.push(self.rpcManager.handleResponse.bind(self.rpcManager));
    self.middleFunctions.push(playerJoin);
    self.middleFunctions.push(playerAction);
    self.middleFunctions.push(playerQuit);
    self.middleFunctions.push(fileShareInvite);
    self.middleFunctions.push(receiveFile);
    self.middleFunctions.push(sharingEnd);
    self.middleFunctions.push(sharingCancel);
    self.middleFunctions.push(mediaStream);
    self.middleFunctions.push(signalingMessage);

    //Compose the midleware functions
    self.runMiddlewares = compose.apply(this, self.middleFunctions);


    self.remoteCalls.handshake(options, function(err, muzzData){
      //If error return the error.
      if (err) {
        self.trigger('error', err);
        try {self._socket.close();} catch (e) {}
        return callback(err);
      }

      self.remoteCalls.loginApp(options, function(err, muzzData){
        //If error return the error.
        if (err) {
          self.trigger('error', err);
          try {self._socket.close();} catch (e) {}
          return callback(err);
        }

        self.remoteCalls.createActivity(options, function(err, muzzData){
          //If error return the error.
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

          //Create the activity object
          var activity = {
            quit: function (callback) {
              processQuit(self, callback);
            },
            activityId: muzzData.d.activityId,
            qrCodeUrl: muzzData.d.qrCodeUrl
          };

          // Enable Events on activity
          Eventify.enable(activity);

          // Add the activity object to the current context self
          self.activity = activity;

          if (self.reconnecting) {
            self.onreconnect();
          } else {
            self.trigger('connect', activity);
            if (callback){
              callback(null, activity);
            }
          }
        });

      });

    });
  };

  // Function to handle socket messages
  var onmessage = function(message) {
    self.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  function retryConnect(remainingAttempts) {
    if (remainingAttempts <= 0) {





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
      self.trigger('error', {error:'Timeout'});
      retryConnect(--remainingAttempts);
    }, TIMEOUT);

    self._socket = new self.socket(self.getEndPoint());

    self._socket.onerror = function onerror(error)  {
      //Clear conncetion timeout

      console.log('error!', error);

      clearTimeout(connectionTimeout);
      self.trigger('error', error);

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
