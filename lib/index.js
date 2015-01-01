var Eventify                = require('eventify');
var compose                 = require('./utils/compose');


// Middleware
var IdlingMonitor           = require('./middleware/IdlingMonitor');
var hb                      = require('./middleware/heartBeat');
var participantJoin         = require('./middleware/activity/participantJoin')();
var widgetAction            = require('./middleware/activity/widgetAction');
var participantQuit         = require('./middleware/activity/participantQuit');
var activityTerminated      = require('./middleware/participant/activityTerminated');
var transformControl        = require('./middleware/participant/transformControl');
var setupComponent          = require('./middleware/participant/setupComponent');

var fileShareInvite         = require('./middleware/fileShare').fileShareInvite;
var receiveFile             = require('./middleware/fileShare').receiveFile;
var sharingEnd              = require('./middleware/fileShare').sharingEnd;
var sharingCancel           = require('./middleware/fileShare').sharingCancel;

var mediaStream             = require('./middleware/mediaStream');
var publishMessage          = require('./middleware/publishMessage');
var signalingMessage        = require('./middleware/signalingMessage');

var RpcManager              = require('./rpcManager/RpcManager');
var RemoteCalls             = require('./remoteCalls/RemoteCalls');

var errorSender = null;
var socket = null;
var path = null;
var schemas = null; // { secure: '', insecure: '' }

var insecurePorts = [80, 2080];
var securePorts = [443];

// Models
var User = require('./models/User');
var Activity = require('./models/Activity');
var Channel = require('./models/Channel');
var ChannelManager = require('./models/ChannelManager');

var TYPE_APP = 'app';
var TYPE_USER = 'user';

var COMMUNICAITON_MODE_PUBSUB = 'pubsub';
var COMMUNICAITON_MODE_ACTIVITY = 'activity';

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
function MuzzleyClient(options) {
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
    self.clearReconnectionStatus();
    self.maybeReconnect();
  });
  this.idlingMonitor.on('message', function (message) {
    self.trigger('debug', { type: 'message-in', message: message });
  });

  this.doSendErrors = (typeof options.sendErrors === 'boolean') ? options.sendErrors : true;
  this.on('error', function (error) {
    if (!error || typeof errorSender !== 'function' || !self.doSendErrors) return;
    if (error.code === 'ETIMEOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      var lastEndpoint = self.getEndPoint({noDebug: true});
      errorSender({code: error.code, message: error.message, endpoint: lastEndpoint}, self.secure);
    }
  });

  this.communicationMode = null;
  this.participants = {};
  this._user = null;
  this.channelManager = new ChannelManager();

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
    middlewareFunctions.push(publishMessage);
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
    middlewareFunctions.push(publishMessage);
    middlewareFunctions.push(participantJoin);
    middlewareFunctions.push(widgetAction);
    middlewareFunctions.push(participantQuit);
    middlewareFunctions.push(fileShareInvite);
    middlewareFunctions.push(receiveFile);
    middlewareFunctions.push(sharingEnd);
    middlewareFunctions.push(sharingCancel);
    middlewareFunctions.push(mediaStream);
    middlewareFunctions.push(signalingMessage);
  }
  return middlewareFunctions;
};

function processQuit(muzzleyClient) {
  muzzleyClient.idlingMonitor.stop();
  try {muzzleyClient._socket.close();} catch (e) {}
  muzzleyClient.trigger('disconnect');
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
    if (self.reconnectOptions.entryPoint === 'init') {
      self.__initCommon(
        self.reconnectOptions.type,
        self.reconnectOptions.options,
        self.reconnectOptions.callback
      );
    } else {
      self.__connectCommon(
        self.reconnectOptions.type,
        self.reconnectOptions.options,
        self.reconnectOptions.callback
      );
    }
  }, curDelay);
};

MuzzleyClient.prototype.__assertCommunicationMode = function(mode) {
  if (!this.communicationMode) {
    this.communicationMode = mode;
  }

  if (this.communicationMode === mode) {
    return;
  }

  var err;
  if (this.communicationMode === COMMUNICAITON_MODE_ACTIVITY) {
    err = new Error('Cannot perform publish/subscribe communication requests once an Activity has been created or joined.');
  } else {
    err = new Error('Cannot create or join an activity once publish/subscribe communication has been used.');
  }
  err.code = 'ECOMMMODE';
  throw err;
};

/**
 * Main function that connects you to muzzley as an App
 * 
 * @param  {object}   options
 * @param  {Function} callback
 * @return {undefined}
 */
MuzzleyClient.prototype.connectApp = function(options, callback) {
  return this.__connectCommon(TYPE_APP, options, callback);
};

/**
 * Main function that connects you to muzzley as a User
 * 
 * @param  {object}   options
 * @param  {Function} callback
 * @return {undefined}
 */
MuzzleyClient.prototype.connectUser = function(options, callback) {
  return this.__connectCommon(TYPE_USER, options, callback);
};

MuzzleyClient.prototype.__connectCommon = function(type, options, callback) {
  var self = this;
  callback = callback || function () {};

  this.__assertCommunicationMode(COMMUNICAITON_MODE_ACTIVITY);

  var TIMEOUT = this.maintenance.connectTimeout;
  var connectionTimeout;

  options._connectCommon = true;

  var channel = options._channel || new Channel({ remoteCalls: self.remoteCalls });

  this.reconnectOptions = {
    type: type,
    // options: JSON.parse(JSON.stringify(options)),
    options: options,
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
      switch (type) {
        case TYPE_USER:
          authFunction = self.remoteCalls.authUser.bind(self.remoteCalls);
          nextStep = joinActivity;
          break;
        case TYPE_APP:
          authFunction = self.remoteCalls.loginApp.bind(self.remoteCalls);
          nextStep = createActivity;
          break;
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
      options._backwardCompatible = true;
      options._channel = channel;
      self.create(options, callback);
      return;
    }

    function joinActivity() {
      options._backwardCompatible = true;
      options._channel = channel;
      self.join(options, callback);
      return;
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

  return channel;
};

MuzzleyClient.prototype.initApp = function(options, callback) {
  var opts = {
    handshake: {
      deviceId: options.deviceId
    },
    loginApp: {
      id: options.id,
      token: options.token
    },
    create: options.create
  };
  return this.__initCommon(TYPE_APP, opts, callback);
};

MuzzleyClient.prototype.initUser = function(options, callback) {
  var opts = {
    handshake: {
      deviceId: options.deviceId
    },
    loginUser: {
      id: options.id,
      token: options.token
    },
    join: options.join
  };
  return this.__initCommon(TYPE_USER, opts, callback);
};

MuzzleyClient.prototype.__initCommon = function(type, options, callback) {
  var self = this;
  callback = callback || function () {};

  var performJoinOrCreate = (options.join || options.create);
  options._initCommon = true;

  var recreationOptions = null;
  if (performJoinOrCreate) {
    this.__assertCommunicationMode(COMMUNICAITON_MODE_ACTIVITY);
    if (options.join) {
      recreationOptions = JSON.parse(JSON.stringify(options.join));
    } else {
      recreationOptions = JSON.parse(JSON.stringify(typeof options.create === 'object' ? options.create : {}));
    }
  }

  var TIMEOUT = this.maintenance.connectTimeout;
  var connectionTimeout;

  var channel = options._channel || new Channel({
    remoteCalls: self.remoteCalls,
    _creationOptions: recreationOptions
  });

  this.reconnectOptions = {
    type: type,
    options: JSON.parse(JSON.stringify(options)),
    callback: callback,
    entryPoint: 'init'
  };
  // Don't perform a base Join or Create operation when reconnecting
  // since that's handled by all the channels themselves.
  delete this.reconnectOptions.options.join;
  delete this.reconnectOptions.options.create;

  var onopen = function()  {
    clearTimeout(connectionTimeout);
    self.idlingMonitor.start();

    var middlewareFunctions = self.__getMiddleware(type);
    self.runMiddlewares = compose.apply(this, middlewareFunctions);

    init();

    function init() {
      self.remoteCalls.init(options, function (err, muzzData){
        if (err || !muzzData || !muzzData.d) {
          err = err || new Error('Invalid response payload');
          channel.trigger('error', err);
          if (options._backwardCompatible) {
            self.trigger('error', err); // Backward compatibility
            try {self._socket.close();} catch (e) {}
          }
          return callback(err);
        }

        if (!options._backwardCompatible && !self.reconnecting) {
          self.trigger('connect');
        }

        if (self.reconnecting) {
          return self.__handleChannelReconnect();
        }

        if (!performJoinOrCreate) {
          return callback();
        }

        var channelOptions = {};
        switch (type) {
          case TYPE_USER:
            self.__handleJoinResponse(options, channel, muzzData.d.join, callback);
            break;
          case TYPE_APP:
            self.__handleCreateResponse(options, channel, muzzData.d.create, callback);
            break;
        }
      });
    }
  }; // onopen

  var onmessage = function(message) {
    self.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain. Ignore it.
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
  return channel;
};


MuzzleyClient.prototype.join = function (options, callback) {
  var self = this;
  callback = callback || function () {};

  this.__assertCommunicationMode(COMMUNICAITON_MODE_ACTIVITY);

  var channel;
  if (options._channel) {
    channel = options._channel;
  } else {
    channel = new Channel({ remoteCalls: self.remoteCalls });
    channel.setCreationOptions(JSON.parse(JSON.stringify(options)));
  }

  self.remoteCalls.joinActivity(options.activityId, function (err, muzzData) {
    if (err) {
      channel.trigger('error', err);
      if (options._backwardCompatible) {
        self.trigger('error', err);
        try {self._socket.close();} catch (e) {}
      }
      return callback(err);
    }
    self.__handleJoinResponse(options, channel, muzzData.d, callback);
  });

  return channel;
};

MuzzleyClient.prototype.create = function (options, callback) {
  var self = this;
  callback = callback || function () {};

  this.__assertCommunicationMode(COMMUNICAITON_MODE_ACTIVITY);

  var channel;
  if (options._channel) {
    channel = options._channel;
  } else {
    channel = new Channel({ remoteCalls: self.remoteCalls });
    channel.setCreationOptions(JSON.parse(JSON.stringify(options)));
  }

  self.remoteCalls.createActivity(options, function(err, muzzData){
    if (err) {
      channel.trigger('error', err);
      if (options._backwardCompatible) {
        self.trigger('error', err);
        try {self._socket.close();} catch (e) {}
      }
      return callback(err);
    }
    self.__handleCreateResponse(options, channel, muzzData.d, callback);
  });
};

MuzzleyClient.prototype.subscribe = function (options, callback) {
  var self = this;
  callback = callback || function () {};

  this.__assertCommunicationMode(COMMUNICAITON_MODE_PUBSUB);

  var channel;
  if (options._channel) {
    channel = options._channel;
  } else {
    channel = new Channel({ remoteCalls: self.remoteCalls });
    channel.setCreationOptions(JSON.parse(JSON.stringify(options)));
  }
  
  self.remoteCalls.subscribe(options, function (err, muzzData) {
    if (err) {
      channel.trigger('error', err);
      return callback(err);
    }

    self.__handleSubscribeResponse(options, channel, muzzData.d, callback);
  });
  return channel;
};

MuzzleyClient.prototype.publish = function (options, callback) {
  var self = this;

  this.__assertCommunicationMode(COMMUNICAITON_MODE_PUBSUB);

  self.remoteCalls.publish(options, callback);
};

/**
 * Private. Handles a channel creation response.
 * 
 * @param  {object} channel        The already existing `models/Channel` object that
 *                                 will be enhanced with the new incoming properties.
 * @param  {object} channelOptions The channel creation options.
 *                                 - id: The channel identifier.
 * @return {undefined}
 */
MuzzleyClient.prototype.__handleChannelCreation = function (channel, channelOptions) {
  var channelId = null;
  if (channelOptions && channelOptions.id) {
    channelId = channelOptions.id;
  }
  var originalId = channel.getId();
  var channelRemoteCalls = this.remoteCalls.getNew({ channelId: channelId });
  channel.setId(channelId);
  channel.setRemoteCalls(channelRemoteCalls);
  this.channelManager.add(channel, originalId);
};

MuzzleyClient.prototype.__handleJoinResponse = function (options, channel, responseData, callback) {

  var self = this;

  if (responseData && responseData.connectTo) {
    // We're being redirected
    try {self._socket.close();} catch (e) {}
    self.endPointHost = responseData.connectTo;
    options._channel = channel;
    if (options._initCommon) {
      self.__initCommon(TYPE_USER, options, callback);
    } else if (options._connectCommon) {
      self.__connectCommon(TYPE_USER, options, callback);
    } else {
      self.trigger('error', new Error('Cannot join activity because we would be redirected.'));
    }
    return;
  }
  
  if (!responseData || !responseData.participant) {
    var error = new Error('Unexpected join response');
    channel.trigger('error', error);
    if (options._backwardCompatible) {
      self.trigger('error', error); // Backward compatibility
      try {self._socket.close();} catch (e) {}
    }
    return callback(error);
  }

  self.__handleChannelCreation(channel, responseData.channel);

  var user;
  if (channel.getUser()) {
    user = channel.getUser();
  } else {
    user = User.fromMessage(responseData.participant, channel.getRemoteCalls());
  }
  channel.setUser(user);

  // The default is to abstract the Send Ready event to activity
  channel.getRemoteCalls().sendReady(function (err, muzzData){

    if (self.reconnecting) {
      return callback(null, user);
    } else {
      if (options._backwardCompatible) {
        if (!channel._connectTriggered) {
          self.trigger('connect', user); // Backward compatibility
          self.trigger('join', user);  // Backward compatibility
        }
      }
      if (!channel._connectTriggered) {
        channel._connectTriggered = true;
        // New event
        channel.trigger('join', user);
      }
      return callback(null, user);
    }
  });
};

MuzzleyClient.prototype.__handleCreateResponse = function (options, channel, responseData, callback) {
  var self = this;

  if (responseData && responseData.connectTo) {
    // We're being redirected
    try {self._socket.close();} catch (e) {}
    self.endPointHost = responseData.connectTo;
    options._channel = channel;
    if (options._initCommon) {
      self.__initCommon(TYPE_APP, options, callback);
    } else if (options._connectCommon) {
      self.__connectCommon(TYPE_APP, options, callback);
    } else {
      self.trigger('error', new Error('Cannot create activity because we would be redirected.'));
    }
    return;
  }

  self.__handleChannelCreation(channel, responseData.channel);

  var activity = channel.getActivity();
  if (activity) {
    // Reuse and update the existing activity object
    activity.removeAllParticipants();
    activity.activityId = responseData.activity.activityId;
    activity.qrCodeUrl = responseData.activity.qrCodeUrl;
  } else {
    // Create a new activity object
    activity = Activity.fromMessage(responseData.activity, channel.getRemoteCalls());
    channel.setActivity(activity);
    activity.on('quitPerformed', function () {
      // When the user calls activity.quit()
      processQuit(self);
      channel.setActivity(null);
    });
  }

  if (self.reconnecting) {
    return callback(null, activity);
  } else {
    if (options._backwardCompatible) {
      if (!channel._connectTriggered) {
        self.trigger('connect', activity); // Backward compatibility
        self.trigger('create', activity);  // Backward compatibility
      }
    }
    if (!channel._connectTriggered) {
      channel._connectTriggered = true;
      channel.trigger('create', activity);
    }
    return callback(null, activity);
  }
};

MuzzleyClient.prototype.__handleSubscribeResponse = function (options, channel, responseData, callback) {
  var self = this;
  self.__handleChannelCreation(channel, responseData.channel);
  if (!channel.subscribeTriggered) {
    channel.subscribeTriggered = true;
    channel.trigger('subscribe');
  }
  return callback(null, channel);
};

MuzzleyClient.prototype.__handleChannelReconnect = function () {
  var self = this;
  var channels = this.channelManager.getAll();
  var remainingChannels = channels.length;

  var checkComplete = function () {
    if (--remainingChannels === 0) {
      self.onreconnect();
    }
  };

  channels.forEach(function (channel) {
    var opts = channel.getCreationOptions();
    if (!opts) {
        // This is a base init channel (no create, activity or subscribe performed)
        return checkComplete();
    }
    opts._channel = channel;
    if (channel.getUser()) {
      self.join(opts, checkComplete);
    } else if (channel.getActivity()) {
      self.create(opts, checkComplete);
    } else {
      self.subscribe(opts, checkComplete);
    }
  });
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
