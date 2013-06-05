/**
 * Don't call this module on its own. These functions
 * are to be included by the concrete remoteCall modules.
 */

var messageTypes = require('../utils/messageTypes');

exports = module.exports = {

  handshake: function (callback) {

    var handshakeJSON = {
      a: 'handshake',
      d: {
        protocolVersion: '1.0',
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
  }

};