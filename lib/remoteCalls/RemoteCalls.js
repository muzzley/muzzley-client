var pkg = require('../../package.json');
var messageTypes = require('../utils/messageTypes');

var isNode = (typeof exports !== 'undefined' && this.exports !== exports);

function RemoteCalls(options){
  options = options || {};
  this.send = options.send;
  this.rpcManager = options.rpcManager;
  this.channelId = options.channelId;
}

RemoteCalls.prototype.getNew = function (options) {
  options = options || {};
  return new RemoteCalls({
    send: options.send || this.send,
    rpcManager: options.rpcManager || this.rpcManager,
    channelId: options.channelId || this.channelId
  });
};

RemoteCalls.prototype.__decorateMessage = function (message) {
  if (this.channelId) {
    message.h = message.h || {};
    message.h.ch = this.channelId;
  }
};

RemoteCalls.prototype.__rpcRequest = function (message, callback) {
  this.__decorateMessage(message);
  this.rpcManager.makeRequest(message, callback);
};

// FF = Fire and Forget
RemoteCalls.prototype.__ffRequest = function (message, callback) {
  this.__decorateMessage(message);
  this.send(JSON.stringify(message));
};

RemoteCalls.prototype.__getHandshakeMessage = function (options) {
  var lib;
  var userAgent;
  if (isNode) {
    lib = 'nodejs v' + pkg.version;
    // Ex: 'node.js v0.10.28; linux x64'
    userAgent = 'node.js ' + process.version + '; ' + process.platform + ' ' + process.arch;
  } else {
    lib = 'js v' + pkg.version;
    userAgent = (navigator && navigator.userAgent) ? navigator.userAgent : 'unknown';
  }

  var handshakeJson = {
    a: 'handshake',
    d: {
      protocolVersion: pkg.protocolVersion,
      lib: lib,
      userAgent: userAgent
    }
  };

  if (options && options.deviceId) {
    handshakeJson.d.deviceId = options.deviceId;
  }

  return handshakeJson;
};

RemoteCalls.prototype.handshake = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var handshakeJson = this.__getHandshakeMessage(options);
  this.__rpcRequest(handshakeJson, callback);
};

RemoteCalls.prototype.__getLoginAppMessage = function (options) {
  var appToken = (typeof options === 'object') ? options.token : options;
  var loginApp = {
    a: 'loginApp',
    d: {
      token: appToken
    }
  };
  if (options.id) {
    loginApp.d.id = options.id;
  }
  return loginApp;
};

/**
 * @param {String|object} options Required. The application token either as a
 *                                string or an object with a `token` property.
 * @param {function} callback     Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.loginApp = function (options, callback){
  var loginAppJson = this.__getLoginAppMessage(options);
  this.__rpcRequest(loginAppJson, callback);
};

RemoteCalls.prototype.__getLoginUserMessage = function (options) {
  var userToken = (typeof options === 'object') ? options.token : options;
  var loginUser = {
    a: 'loginUser',
    d: {
      token: userToken
    }
  };
  if (options.id) {
    loginUser.d.id = options.id;
  }
  return loginUser;
};

/**
 * @param {String|object} options Required. The user token either as a
 *                                string or an object with a `token` property.
 * @param {function} callback     Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.authUser = function (options, callback) {
  var loginUserJson = this.__getLoginUserMessage(options);
  this.__rpcRequest(loginUserJson, callback);
};

RemoteCalls.prototype.__getCreateMessage = function (options) {
  var createActivity = {
    a: 'create'
  };

  if (options) {
    createActivity.d = (options && options.protocolOptions && options.protocolOptions.create) ? options.protocolOptions.create : {};
    if (options.activityId) createActivity.d.activityId = options.activityId;
  }
  return createActivity;
};

/**
 * @param {object} [options]  Optional. An object with a property `activityId` to
 *                            indicate a static activity id.
 * @param {function} callback Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.createActivity = function (options, callback) {

  if (typeof options === 'function') {
    // no options provided, just the callback
    callback = options;
    options = false;
  }

  var createJson = this.__getCreateMessage(options);
  this.__rpcRequest(createJson, callback);
};

RemoteCalls.prototype.__getJoinMessage = function (options) {
  var joinActivity = {
    a: 'join',
    d: {
      activityId: options.activityId
    }
  };
  return joinActivity;
};

RemoteCalls.prototype.joinActivity = function(activityId, callback){
  var joinJson = this.__getJoinMessage({ activityId: activityId });
  this.__rpcRequest(joinJson, callback);
};

RemoteCalls.prototype.init = function (options, callback) {
  var initMessage = {
    a: 'init',
    d: {}
  };
  initMessage.d.handshake = this.__getHandshakeMessage(options.handshake).d;
  
  if (options.loginApp) {
    initMessage.d.loginApp = this.__getLoginAppMessage(options.loginApp).d;
  }
  if (options.loginUser) {
    initMessage.d.loginUser = this.__getLoginUserMessage(options.loginUser).d;
  }

  if (options.join) {
    initMessage.d.join = this.__getJoinMessage(options.join).d;
  }
  if (options.create) {
    initMessage.d.create = this.__getCreateMessage(options.create).d;
  }

  this.__rpcRequest(initMessage, callback);
};

RemoteCalls.prototype.__getSubscribeMessage = function (options) {
  var message = {
    a: 'subscribe',
    d: {
      ns: options.namespace,
      p: options.payload
    }
  };
  return message;
};

RemoteCalls.prototype.subscribe = function (options, callback) {
  var message = this.__getSubscribeMessage(options);
  this.__rpcRequest(message, callback);
};

RemoteCalls.prototype.__getUnsubscribeMessage = function () {
  var message = {
    a: 'unsubscribe'
  };
  return message;
};

RemoteCalls.prototype.unsubscribe = function (callback) {
  var message = this.__getUnsubscribeMessage();
  this.__rpcRequest(message, callback);
};

RemoteCalls.prototype.__getPublishMessage = function (options) {
  var message = {
    h: {},
    a: 'publish',
    d: {
      ns: options.namespace,
      p: options.payload
    }
  };
  if (options.onBehalfOf) {
    message.h.u = options.onBehalfOf;
  }
  return message;
};

RemoteCalls.prototype.publish = function (options, callback) {
  var message = this.__getPublishMessage(options);

  if (typeof callback === 'function') {
    this.__rpcRequest(message, function (err, result) {
      rpcResponseHandler(err, result, true, callback);
    });
  } else {
    message.h.t = messageTypes.MESSAGE_TYPE_SIGNAL;
    this.__ffRequest(message);
  }
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
RemoteCalls.prototype.changeWidget = function (widget, params, pid, callback){
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

  this.__rpcRequest(msg, callback);
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
RemoteCalls.prototype.setupComponent = function (component, pid, callback){
  var msg = {
    h: {},
    a: 'signal',
    d: {
      a: 'setupComponent',
      d: {}
    }
  };

  function setupComponentCallback(err, data) {
    // Abstract the response to only return the success (true/false) value
    callback(err, data.s);
  }

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

  this.__rpcRequest(msg, setupComponentCallback);
};

RemoteCalls.prototype.sendReady = function(callback){
  var sendReady = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };
  this.__rpcRequest(sendReady, callback);
};

RemoteCalls.prototype.sendWidgetData = function (data){
  var msg = {
    h: {
      t: messageTypes.MESSAGE_TYPE_SIGNAL
    },
    a: 'signal',
    d: data
  };

  this.__ffRequest(msg);
};

RemoteCalls.prototype.successResponse = function (originalHeader) {

  var msg = {
    h: originalHeader,
    s: true
  };

  if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST) {
    msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE_CORE;
  }

  this.__ffRequest(msg);
};

RemoteCalls.prototype.response = function (originalHeader, success, message, data) {
  var msg = {
    h: originalHeader,
    s: success
  };
  if (message) {
    msg.m = message;
  }
  if (typeof data !== 'undefined') {
    msg.d = data;
  }

  if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST) {
    msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE_CORE;
  }

  this.__ffRequest(msg);
};

/**
 * Send a media sharing invitation to an opposing client.
 *
 * function (options[, pid], callback)
 * 
 * @param {object} options    Required with the following params:
 *                            - context: A string identifying the sharing session
 *                            - filesCount: Optional. The number of files that will be
 *                              transfered in this session. 
 *                            - totalSize: Optional. The total size of the files that
 *                              will be transferred in this session.
 * @param {object} pid        Optional. The target participant. Only used for
 *                            messages initiated by the activity master.
 * @param {function} callback Required. function(err, response).
 *                            The `response` argument is an object with params:
 *                            - accept: Boolean indicating whether the invitation was accepted.
 *                            - reason: An optional string explaining the `accept` value.
 */
RemoteCalls.prototype.sendSharingInvitation = function (options, pid, callback) {
  var msg  = {
    h: {},
    a: 'signal',
    d: {
      a: 'sharingInvitation',
      d: options
    }
  };

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else if (typeof pid === 'function') {
    callback = pid;
  }

  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function invitationCallback(err, result) {
    // Only send "up" the response's data (`d`) field
    if (!result || err) {
      return callback(err);
    }

    result = result || {};
    result.d = result.d || {};

    var accept = (typeof result.d.accept !== 'boolean') ? false : result.d.accept;
    var reason = (typeof result.d.reason === undefined) ? '' : result.d.reason;
    callback(err, {
      accept: accept,
      reason: reason
    });
  }

  this.__rpcRequest(msg, invitationCallback);
};

RemoteCalls.prototype.fileShareInvitationResponse = function (originalHeader, accept, reason) {
  var msg = {
    h: originalHeader,
    s: true,
    d: {
      accept: accept,
      reason: reason
    }
  };
  msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;

  this.__ffRequest(msg);
};

/**
 * Request a file sharing URL from the muzzley servers so that
 * the actual file can be uploaded (HTTP POST).
 *
 * function (options[, pid], callback)
 * 
 * @param {object} options    Required with the following params:
 *                            - context: A string identifying the sharing session
 *                            - fileName: A string with the name of the file.
 *                            - contentType: The MIME type of the file such as "image/jpeg"
 * @param {object} pid        Optional. The target participant. Only used for
 *                            messages initiated by the activity master.
 * @param {function} callback Required. function(err, response).
 *                            The `response` argument is an object with params:
 *                            - token: The file sharing token string (an identifier).
 *                            - url: The URL to which we can now POST the file.
 */
RemoteCalls.prototype.shareFile = function (options, pid, callback) {
  var msg  = {
    h: {},
    a: 'shareFile',
    d: options
  };

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else if (typeof pid === 'function') {
    callback = pid;
  }

  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function shareFileCallback(err, result) {
    if (!result || err) {
      return callback(err);
    }
    result = result || {};

    if (typeof result.s !== 'boolean' || result.s === false) {
      return callback(new Error(result.m || 'Could not request file sharing URL.'));
    } else if (!result.d || !result.d.token || !result.d.url) {
      return callback(new Error('Error requesting file sharing URL.'));
    }

    callback(err, {
      token: result.d.token,
      url: result.d.url
    });
  }

  this.__rpcRequest(msg, shareFileCallback);
};

/**
 * Cancel an ongoing file sharing context.
 *
 * @param {function} callback   function (err, success) where
 *                              `success` is a boolean.
 */
RemoteCalls.prototype.sharingCancel = function (context, pid, callback) {
  var msg  = {
    h: {},
    a: 'signal',
    d: {
      a: 'sharingCancel',
      d: {
        context: context
      }
    }
  };

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else if (typeof pid === 'function') {
    callback = pid;
  }

  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function sharingCancelCallback(err, result) {
    if (!result || err) {
      return callback(err);
    }

    var success = (typeof result.s === 'boolean') ? result.s : false;
    return callback(null, success);
  }

  this.__rpcRequest(msg, sharingCancelCallback);
};

/**
 * Mark the Sharing Session as complete.
 *
 * @param {function} callback   function (err, success) where
 *                              `success` is a boolean.
 */
RemoteCalls.prototype.sharingEnd = function (context, pid, callback) {
  var msg  = {
    h: {},
    a: 'signal',
    d: {
      a: 'sharingEnd',
      d: {
        context: context
      }
    }
  };

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else if (typeof pid === 'function') {
    callback = pid;
  }

  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function sharingEndCallback(err, result) {
    if (!result || err) {
      return callback(err);
    }

    var success = (typeof result.s === 'boolean') ? result.s : false;
    return callback(null, success);
  }

  this.__rpcRequest(msg, sharingEndCallback);
};

/**
 * Send a custom signal message to the remote endpoint.
 * function (type, data[, pid][, callback])
 * @param {object} type       Required. The signal type string
 * @param {object} data       Required. The data object
 * @param {object} pid        Optional. The target participant. Only used for messages
 *                            initiated by the activity master.
 * @param {function} callback Optional. function(err, response).
 *                            If not provided, the message will be a
 *                            fire-and-forget message. If provided,
 *                            the message will be an RPC request and once
 *                            the correct response is received or a timeout
 *                            is reached, the callback will be called with
 *                            the response.
 */
RemoteCalls.prototype.sendSignal = function (type, data, pid, callback) {
  var msg  = {
    h: {},
    a: 'signal',
    d: {
      a: type,
      d: data
    }
  };

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else if (typeof pid === 'function') {
    callback = pid;
  }

  if (typeof callback === 'function') {
    this.__rpcRequest(msg, function (err, result) {
      rpcResponseHandler(err, result, false, callback);
    });
  } else {
    msg.h.t = messageTypes.MESSAGE_TYPE_SIGNAL;
    this.__ffRequest(msg);
  }
};

/**
 * Gracefully quits a Muzzley session and closes the socket connection.
 * 
 * @param  {Function} callback
 * @return {undefined}
 */
RemoteCalls.prototype.quit = function (callback) {
  var quit = {
    a: 'quit'
  };
  this.__rpcRequest(quit, callback);
};

function rpcResponseHandler(err, result, doAbstractFields, callback) {
  // Only send "up" the response's data (`d`) field
  if (!result) {
    return callback(err);
  }
  result = result || {};
  var responseData = (typeof result.d === undefined) ? {} : result.d;
  var success = (typeof result.s === undefined) ? false : result.s;
  var message = (typeof result.m === undefined) ? '' : result.m;

  if (doAbstractFields) {
    return callback(success ? null : new Error(message || 'Unsuccessful call'), responseData);
  } else {
    callback(err, {
      data: responseData,
      success: success,
      message: message,
      // Backwards compatibility:
      d: responseData,
      s: success,
      m: message
    });
  }
}

module.exports = RemoteCalls;
