

function remoteCalls (socket, rpcManager, options) {
  // TODO implement options if passed
  this.rpcManager = rpcManager;
  this.socket = socket;
}


remoteCalls.prototype.handShake = function(callback){

  var msg = {
    a: 'handshake',
    d: {
      // Mandatory
      protocolVersion: '1.0',
      // All the following are optional and experimental
      lib: 'nodejs',
      userAgent: 'muzzley-sdk-js',
      connection: 'LAN',
      contentType: 'application/json'
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.authApp = function (token, callback) {
  var msg = {
    'a': 'loginApp',
    'd': {
      'token': token
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.authUser = function (token, callback){
  var msg = {
    a: 'loginUser',
    d: {
      token: token
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.widgetData= function (data){
  var msg = {
    h: {
      t: 5
    },
    a: 'signal',
    d: data
  };
  this.sock.send(JSON.stringify(msg));
};

remoteCalls.prototype.createActivity = function (activityId, callback){
  var msg = {
    a: 'create',
    d: {
      protocolVersion: '1.0',
      lib: 'js',
      libVersion: '0.1',
      activityId: activityId
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.joinActivity = function (activityId, callback){
  var msg = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

/**
 * Sends the `changeWidget` signaling message to one or multiple participants.
 * function (widget[, params][, pid], callback).
 * 
 * @param {widget} string/object   Either the widget's identifier or an object
 *                                 that will be passed as is in the `d` (data)
 *                                 parameter. Example:
 *                                 {
 *                                   "widget": "gamepad",
 *                                   "params": {
 *                                     "motion": true
 *                                     "fireType": "proximity",
 *                                     "step": 15,
 *                                     "pitch": true,
 *                                     "roll": true,
 *                                     "yaw": true
 *                                   }
 *                                 }
 * @param {params} object          Optional. Defines the widget parametrization.
 *                                 If the widget parametrization is also sent
 *                                 in the `widget` parameter, this one overrides
 *                                 it.
 * @param {pid} string             Optional. The id of the participant that should
 *                                 receive this message. If not provided it will
 *                                 be sent to all participants.
 * @param {callback} function      The function to be called when the participant's
 *                                 response is received.
 *  
 */
remoteCalls.prototype.changeWidget = function (widget, params, pid, callback){
  var msg = {
    h: {},
    a: 'signal',
    d: {
      a: 'changeWidget',
      d: {}
    }
  };

  if (typeof widget === 'string') {
    // Define the widget name
    msg.d.d.widget = widget;
  } else if (typeof widget === 'object') {
    // The whole `d` object was provided
    msg.d.d = widget;
  }

  if (typeof params === 'object') {
    // The `params` object has been provided
    msg.d.d.params = params;
  } else {
    // `params` was not provided, shift the other arguments
    callback = pid;
    pid = params;
  }

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else {
    callback = pid;
  }

  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.sendReady = function (callback) {
  var msg = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.successResponse = function (originalHeader){
  //Protocol message codes
  var MESSAGE_TYPE_REQUEST = 1;
  var MESSAGE_TYPE_RESPONSE = 2;
  var MESSAGE_TYPE_REQUEST_CORE = 3;
  var MESSAGE_TYPE_RESPONSE_CORE = 4;
  var MESSAGE_TYPE_SIGNAL = 5;

  var msg = {
    h: originalHeader,
    s: true
  };
  if (originalHeader.t === MESSAGE_TYPE_REQUEST) {
    msg.h.t = MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = MESSAGE_TYPE_RESPONSE_CORE;
  }
  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.sendSignal = function (actionObj){
  var msg  = {
    h: {
      t: 5
    },
    a: 'signal',
    d: actionObj
  };
  this.socket.send(JSON.stringify(msg));
};

module.exports = remoteCalls;