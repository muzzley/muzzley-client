var messageTypes = require('../utils/messageTypes');

/**
 * Don't call this module on its own. These functions
 * are to be included by the concrete remoteCall modules.
 */

function sharingCommand (command, context, pid, callback) {
}

exports = module.exports = {

  handshake: function (options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    var handshakeJson = {
      a: 'handshake',
      d: {
        protocolVersion: '1.2.0',
        lib: 'nodejs'
      }
    };

    if (options.deviceId) {
      handshakeJson.d.deviceId = options.deviceId;
    }

    this.rpcManager.makeRequest(handshakeJson, callback);
  },

  successResponse: function (originalHeader) {

    var msg = {
      h: originalHeader,
      s: true
    };

    if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST) {
      msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;
    } else if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST_CORE) {
      msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE_CORE;
    }

    this.socket.send(JSON.stringify(msg));
  },

  response: function (originalHeader, success, message, data) {

    var msg = {
      h: originalHeader,
      s: success
    };
    if (message) {
      msg.m = message;
    }
    if (data) {
      msg.d = data;
    }

    if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST) {
      msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;
    } else if (originalHeader.t === messageTypes.MESSAGE_TYPE_REQUEST_CORE) {
      msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE_CORE;
    }

    this.socket.send(JSON.stringify(msg));
  },

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
  sendSharingInvitation: function (options, pid, callback) {
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

    this.rpcManager.makeRequest(msg, invitationCallback);
  },

  fileShareInvitationResponse: function (originalHeader, accept, reason) {
    var msg = {
      h: originalHeader,
      s: true,
      d: {
        accept: accept,
        reason: reason
      }
    };
    msg.h.t = messageTypes.MESSAGE_TYPE_RESPONSE;

    this.socket.send(JSON.stringify(msg));
  },

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
  shareFile: function (options, pid, callback) {
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

    this.rpcManager.makeRequest(msg, shareFileCallback);
  },

  /**
   * Cancel an ongoing file sharing context.
   *
   * @param {function} callback   function (err, success) where
   *                              `success` is a boolean.
   */
  sharingCancel: function (context, pid, callback) {
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

    this.rpcManager.makeRequest(msg, sharingCancelCallback);
  },

  /**
   * Mark the Sharing Session as complete.
   *
   * @param {function} callback   function (err, success) where
   *                              `success` is a boolean.
   */
  sharingEnd: function (context, pid, callback) {
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

    this.rpcManager.makeRequest(msg, sharingEndCallback);
  },

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
  sendSignal: function (type, data, pid, callback){
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

    function signalResponseCallback(err, result) {
      // Only send "up" the response's data (`d`) field
      if (!result) {
        return callback(err);
      }
      result = result || {};
      var responseData = (typeof result.d === undefined) ? {} : result.d;
      var success = (typeof result.s === undefined) ? false : result.s;
      var message = (typeof result.m === undefined) ? '' : result.m;
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

    if (typeof callback === 'function') {
      this.rpcManager.makeRequest(msg, signalResponseCallback);
    } else {
      msg.h.t = messageTypes.MESSAGE_TYPE_SIGNAL;
      this.socket.send(JSON.stringify(msg));
    }
  },

  /**
   * Gracefully quits a Muzzley session and closes the socket connection.
   * 
   * @param  {Function} callback
   * @return {undefined}
   */
  quit: function (callback){
    var quit = {
      a: 'quit'
    };
    this.rpcManager.makeRequest(quit, callback);
  }

};
