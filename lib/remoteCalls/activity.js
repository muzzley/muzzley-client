//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}


remoteCalls.prototype.handshake = function(callback){
  var handshakeJSON = {
    a: 'handshake',
    d: {
      // Mandatory
      protocolVersion: '1.0',
      // All the following are optional and experimental
      lib: 'nodejs',
      userAgent: 'muzzley-client',
      connection: 'LAN',
      contentType: 'application/json'
    }
  };
  this.rpcManager.makeRequest(handshakeJSON, callback);

};

remoteCalls.prototype.loginApp = function(callback){
  var loginApp = {
    a: 'loginApp',
    d: {
      token: 'muzzlionaire' //TODO: Token passed in opts
    }
  };
  this.rpcManager.makeRequest(loginApp, callback);

};
remoteCalls.prototype.createActivity = function(callback){
  var createActivity = {
    a: 'create'
  };

  this.rpcManager.makeRequest(createActivity, callback);
};


remoteCalls.prototype.successResponse = function(originalHeader){

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

remoteCalls.prototype.quit = function (data, callback){
  var quit = {
    a: 'quit'
  };

  this.rpcManager.makeRequest(quit, callback);
};

/**
 * Sends the `changeWidget` signaling message to one or multiple participants.
 * function (widget[, params][, pid], callback).
 *
 * @param {string/object} widget   Either the widget's identifier or an object
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
 *                                   },
 *                                   "components": [
 *                                     {
 *                                       "c": "deviceMotion",
 *                                       "p": {
 *                                         "roll": true,
 *                                         "pitch": false
 *                                       }
 *                                     }
 *                                   ]
 *                                 }
 * @param {object} params          Optional. Defines the widget parametrization.
 *                                 If the widget parametrization is also sent
 *                                 in the `widget` parameter, this one overrides
 *                                 it.
 * @param {string} pid             Optional. The id of the participant that should
 *                                 receive this message. If not provided it will
 *                                 be sent to all participants.
 * @param {function} callback      The function to be called when the participant's
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

/**
 * Setup (enable, disable, update) a component.
 * It's a signaling message.
 *
 * componentExample = [
 *   {
 *     "c":"deviceMotion",
 *     "id": "dm1",
 *     "a": "enable",
 *     "p": {
 *       "roll": true,
 *       "pitch": false
 *     }
 *   }
 * ]
 *
 */
remoteCalls.prototype.setupComponent = function (component, pid, callback){
  var msg = {
    h: {},
    a: 'signal',
    d: {
      a: 'setupComponent',
      d: {}
    }
  };

  if (typeof component === 'string') {
    // A single component's name without any params provided
    msg.d.d = {
      c: component
    };
  } else if (typeof component === 'object') {
    // The whole `d` object or an array of objects was provided
    msg.d.d = component;
  }

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else {
    callback = pid;
  }

  this.rpcManager.makeRequest(msg, callback);
};

/**
 * Send a custom signal message to the remote endpoint.
 *
 * @param {object} data       The data object
 * @param {function} callback Optional. function(err, response).
 *                            If not provided, the message will be a
 *                            fire-and-forget message. If provided,
 *                            the message will be an RPC request and once
 *                            the correct response is received or a timeout
 *                            is reached, the callback will be called with
 *                            the response.
 */
remoteCalls.prototype.sendSignal = function (data, pid, callback){
  var msg  = {
    h: {},
    a: 'signal',
    d: data
  };


  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else {
    callback = pid;
  }

  if (typeof callback === 'function') {
    this.rpcManager.makeRequest(msg, callback);
  } else {
    msg.h.t = 5; // fire-and-forget
    this.socket.send(JSON.stringify(msg));
  }
};

module.exports = remoteCalls;