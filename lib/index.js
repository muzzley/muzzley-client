//Lib details
var version = '0.3.0';
var protocol = '1.2.0';

var Eventify                = require('eventify');
var compose                 = require('./utils/compose');

//RPCmanager
var rpcManager              = require('./rpcManager/rpcManager');

//midlewares
var hb                      = require('./middleware/heartBeat');
var playerJoin              = require('./middleware/activity/playerJoin');
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

var insecurePorts = [80, 2080];
var securePorts = [443];

//models
var User = require('./models/User');

//
// MAIN
//

function MuzzleyClient(options){

  this.socket = options.socket;
  this.curPortIndex = 0; // ports[0] = 80
  this.endPointSchema = options.endPointSchema;
  this.endPointHost = options.endPointHost;
  this.endPointPath = options.endPointPath;
  // Use SSL (https, wss)?
  this.secure = (typeof options.secure !== undefined) ? options.secure : false;
  this.manualReady = (typeof options.manualReady !== undefined) ? options.manualReady : false;
  this.ports = this.secure ? securePorts : insecurePorts;

  this.middleFunctions = [];
  this.participants = {};
  this._user = null;

  //Enable events for this muzzley instance
  Eventify.enable(this);

}

function processQuit(muzzleyClient, callback) {
  muzzleyClient.remoteCalls.quit(function(err, data) {
    try {muzzleyClient._socket.close();} catch (e) {}

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
  endPoint += '/';
  endPoint += path || this.endPointPath;
  return endPoint;
};

/**
 * Main function that connects you to muzzley as a Participant
 *
 */
MuzzleyClient.prototype.connectUser = function(options, callback){
  //remember this
  var _this = this;

  var TIMEOUT = 5000;
  var connectionTimeout;

  if (typeof options !== 'object' || !options.token || !options.activityId) {
    throw new Error('Invalid parameters for connectUser()');
  }

  var userToken = options.token;
  var activityId = options.activityId;

  var onopen = function()  {
    clearTimeout(connectionTimeout);

    //Create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new participantRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions = [];
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(transformControl);
    _this.middleFunctions.push(setupComponent);
    _this.middleFunctions.push(activityTerminated);
    _this.middleFunctions.push(fileShareInvite);
    _this.middleFunctions.push(receiveFile);
    _this.middleFunctions.push(sharingEnd);
    _this.middleFunctions.push(sharingCancel);
    _this.middleFunctions.push(signalingMessage);

    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);

   _this.remoteCalls.handshake(options, function(err, muzzData){
      //If error return the error.
      if (err) {
        _this.trigger('error', err);
        try {_this._socket.close();} catch (e) {}
        return callback(err);
      }

      _this.remoteCalls.authUser(userToken, function(err, muzzData){
        if (err) {
          _this.trigger('error', err);
          try {_this._socket.close();} catch (e) {}
          return callback(err);
        }

        _this.remoteCalls.joinActivity(activityId, function(err, muzzData){
          if (err) {
            _this.trigger('error', err);
            try {_this._socket.close();} catch (e) {}
            return callback(err);
          }

          if (muzzData.d && muzzData.d.connectTo) {
            // We're being redirected
            _this.endPointHost = muzzData.d.connectTo;
            try {_this._socket.close();} catch (e) {}
            return connect(_this.ports.length);
          }

          var user = new User({
            id: muzzData.d.participant.id,
            name: muzzData.d.participant.name,
            photoUrl: muzzData.d.participant.photoUrl,
            _remoteCalls: _this.remoteCalls
          });

          // Once the user quits, close its socket connection.
          user.on('quitPerformed', function () {
            try {_this._socket.close();} catch (e) {}
            _this._user = null;
          });

          _this._user = user;

          if (_this.manualReady) {
            // The user wants to send the 'ready' protocol message himself
            _this.trigger("joined", null, user);
            if (callback) {
              return callback(null, user);
            }
          } else {
            // The default is to abstract the Send Ready event to activity
            _this.remoteCalls.sendReady(function (err, muzzData){
              _this.trigger("joined", null, user);
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
    _this.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  function retryConnect(remainingAttempts) {
    if (remainingAttempts <= 0) return;
    _this.switchPort();
    connect(--remainingAttempts);
  }

  function connect(remainingAttempts) {
    // Connection Timeout
    connectionTimeout = setTimeout(function () {
      // Close the socket immediatelly so that it does
      // not have a chance to connect later or we'll have race conditions.
      try {_this._socket.close();} catch (e) {}

      _this.trigger('error', {error:'Timeout'});
      retryConnect(--remainingAttempts);
    }, TIMEOUT);

    _this._socket = new _this.socket(_this.getEndPoint());

    _this._socket.onerror = function onerror(error)  {
      //Clear conncetion timeout
      clearTimeout(connectionTimeout);
      _this.trigger('error', error);
      retryConnect(--remainingAttempts);
    };
    _this._socket.onopen = onopen;
    _this._socket.onmessage = onmessage;
  }

  // First connection attempt with the current
  // connection (host, port, ...) settings
  connect(_this.ports.length);

};


/*
*   Main function that connects you to muzzley as a app
*
*/
MuzzleyClient.prototype.connectApp = function(options, callback){
  //If no callback passed define an empty one
  if (typeof(callback) !== 'function') callback = function(){};
 
  var _this = this;
  var TIMEOUT = 5000;
  var connectionTimeout;

  //On socket connection stablished
  var onopen = function()  {

    //Clear conncetion timeout
    clearTimeout(connectionTimeout);

    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new activityRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions = [];
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(playerJoin);
    _this.middleFunctions.push(playerAction);
    _this.middleFunctions.push(playerQuit);
    _this.middleFunctions.push(fileShareInvite);
    _this.middleFunctions.push(receiveFile);
    _this.middleFunctions.push(sharingEnd);
    _this.middleFunctions.push(sharingCancel);
    _this.middleFunctions.push(mediaStream);
    _this.middleFunctions.push(signalingMessage);

    //Compose the midleware functions
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);


    _this.remoteCalls.handshake(options, function(err, muzzData){
      //If error return the error.
      if (err) {
        _this.trigger('error', err);
        try {_this._socket.close();} catch (e) {}
        return callback(err);
      }

      _this.remoteCalls.loginApp(options, function(err, muzzData){
        //If error return the error.
        if (err) {
          _this.trigger('error', err);
          try {_this._socket.close();} catch (e) {}
          return callback(err);
        }

        _this.remoteCalls.createActivity(options, function(err, muzzData){
          //If error return the error.
          if (err) {
            _this.trigger('error', err);
            try {_this._socket.close();} catch (e) {}
            return callback(err);
          }

          if (muzzData.d && muzzData.d.connectTo) {
            //We're being redirected
            _this.endPointHost = muzzData.d.connectTo;
            try {_this._socket.close();} catch (e) {}
            connect(_this.ports.length);
            return;
          }

          //Create the activity object
          var activity = {
            quit: function (callback) {
              processQuit(_this, callback);
            },
            activityId: muzzData.d.activityId,
            qrCodeUrl: muzzData.d.qrCodeUrl
          };

          // Enable Events on activity
          Eventify.enable(activity);

          // Add the activity object to the current context _this
          _this.activity = activity;

          _this.trigger("connected", activity);
          if (callback){
            callback(null, activity);
          }
          else return ;

        });

      });

    });

  };

  // Function to handle socket messages
  var onmessage = function(message) {
    _this.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  function retryConnect(remainingAttempts) {
    if (remainingAttempts <= 0) return;
    _this.switchPort();
    connect(--remainingAttempts);
  }

  function connect(remainingAttempts) {
    // Connection Timeout
    connectionTimeout = setTimeout(function () {
      // Close the socket immediatelly so that it does
      // not have a chance to connect later or we'll have race conditions.
      try {_this._socket.close();} catch (e) {}
      _this.trigger('error', {error:'Timeout'});
      retryConnect(--remainingAttempts);
    }, TIMEOUT);

    _this._socket = new _this.socket(_this.getEndPoint());

    _this._socket.onerror = function onerror(error)  {
      //Clear conncetion timeout

      clearTimeout(connectionTimeout);
      _this.trigger('error', error);

      retryConnect(--remainingAttempts);
    };
    _this._socket.onopen = onopen;
    _this._socket.onmessage = onmessage;
  }

  // First connection attempt with the current
  // connection (host, port, ...) settings
  connect(_this.ports.length);

};

module.exports = MuzzleyClient;
