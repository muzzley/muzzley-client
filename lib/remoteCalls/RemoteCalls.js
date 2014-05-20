var commons = require('./commons.js');
var messageTypes = require('../utils/messageTypes');
//
// Remotes calls
function RemoteCalls(rpcManager){
  this.rpcManager = rpcManager;
}

RemoteCalls.prototype.setSocket = function(socket) {
  this.socket = socket;
};

RemoteCalls.prototype.handshake = commons.handshake;

/**
 * @param {String|object} options Required. The application token either as a
 *                                string or an object with a `token` property.
 * @param {function} callback     Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.loginApp = function(options, callback){
  var appToken = (typeof options === 'object') ? options.token : options;

  var loginApp = {
    a: 'loginApp',
    d: {
      token: appToken
    }
  };

  this.rpcManager.makeRequest(loginApp, callback);
};

/**
 * @param {String|object} options Required. The user token either as a
 *                                string or an object with a `token` property.
 * @param {function} callback     Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.authUser = function(options, callback){
  var userToken = (typeof options === 'object') ? options.token : options;
  var authUser = {
    a: 'loginUser',
    d: {
      token: userToken
    }
  };
  this.rpcManager.makeRequest(authUser, callback);
};

/**
 * @param {object} [options]  Optional. An object with a property `activityId` to
 *                            indicate a static activity id.
 * @param {function} callback Required. The function to call once the response arrives.
 */
RemoteCalls.prototype.createActivity = function(options, callback){
  var createActivity = {
    a: 'create'
  };

  if (typeof options === 'function') {
    // no options provided, just the callback
    callback = options;
  } else if (typeof options === 'object') {
    // options were provided
    createActivity.d = (options && options.protocolOptions && options.protocolOptions.create) ? options.protocolOptions.create : {};
    if (options.activityId) createActivity.d.activityId = options.activityId;
  }

  this.rpcManager.makeRequest(createActivity, callback);
};

RemoteCalls.prototype.successResponse = commons.successResponse;

RemoteCalls.prototype.response = commons.response;

RemoteCalls.prototype.quit = commons.quit;

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

  this.rpcManager.makeRequest(msg, setupComponentCallback);
};

RemoteCalls.prototype.sendSignal = commons.sendSignal;

RemoteCalls.prototype.sendSharingInvitation = commons.sendSharingInvitation;
RemoteCalls.prototype.fileShareInvitationResponse = commons.fileShareInvitationResponse;
RemoteCalls.prototype.shareFile = commons.shareFile;
RemoteCalls.prototype.sharingCancel = commons.sharingCancel;
RemoteCalls.prototype.sharingEnd = commons.sharingEnd;

RemoteCalls.prototype.joinActivity = function(activityId, callback){
  var joinActivity = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };
  this.rpcManager.makeRequest(joinActivity, callback);
};

RemoteCalls.prototype.sendReady = function(callback){
  var sendReady = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };
  this.rpcManager.makeRequest(sendReady, callback);
};

RemoteCalls.prototype.sendWidgetData = function (data){
  var msg = {
    h: {
      t: messageTypes.MESSAGE_TYPE_SIGNAL
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

module.exports = RemoteCalls;
