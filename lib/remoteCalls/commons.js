var messageTypes = require('../utils/messageTypes');

/**
 * Don't call this module on its own. These functions
 * are to be included by the concrete remoteCall modules.
 */

exports = module.exports = {

  handshake: function (callback) {

    var handshakeJSON = {
      a: 'handshake',
      d: {
        protocolVersion: '1.1.0',
        lib: 'nodejs'
      }
    };

    this.rpcManager.makeRequest(handshakeJSON, callback);
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
    } else {
      callback = pid;
    }

    if (typeof callback === 'function') {
      this.rpcManager.makeRequest(msg, callback);
    } else {
      msg.h.t = messageTypes.MESSAGE_TYPE_SIGNAL;
      this.socket.send(JSON.stringify(msg));
    }
  }

};