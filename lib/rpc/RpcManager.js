var RemoteCalls = require('./RemoteCalls');

var cidCount = 0;
var requests = {};

// Constructor function
function rpcManager (options) {
  rpcManager.$.remoteCalls = RemoteCalls({sock:options.sock, rpcManager:rpcManager.$});
  return rpcManager.$;
}


rpcManager.$ = {
  TIMEOUT: 3000,
  generateCid : function () {
    return ++cidCount;
  },

  makeRequest : function (message, connection, responseCallback) {
    var self = this;

    // Generate a unique correlation id for this call
    var correlationId = self.generateCid();

    // TODO The timeout function should be unique
    // Create a timeout for what should happen if we don't get a response
    var tId = setTimeout(function (cid) {
      // If this ever gets called we didn't get a response in a
      // timely fashion
      responseCallback(new Error("RPC Timeout @ cid " + cid));
      // delete the entry from hash
      delete requests[cid];
    }, self.TIMEOUT, correlationId);

    // create a request entry to store in a hash
    var entry = {
      callback: responseCallback,
      timeout: tId //the id for the timeout so we can clear it
    };

    // Put the entry in the hash so we can match the response later
    requests[correlationId] = entry;

    var MESSAGE_TYPE_REQUEST = 1;
    // Inject the Correlation Id into the message header
    // and set the message type as REQUEST (if not already set).
    message.h = message.h || {};
    message.h.cid = correlationId;
    message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

    var sendingFunc = connection.send || connection.write;
    if (typeof message === 'object') {
      connection.send(JSON.stringify(message));
    } else {
      connection.send(message);
    }
  },
  
  handleResponse: function (message) {
    var self = this;
   
    if (!message || !message.h || typeof message.h.cid === 'undefined') {
      // No Correlation Id defined, nothing to do here...
      return;
    }

    var correlationId = message.h.cid;

    if (correlationId in requests) {
      var entry = requests[correlationId];
      clearTimeout(entry.timeout);
      delete requests[correlationId];
      entry.callback(null, message);
    }
  }
};

module.exports = rpcManager;
