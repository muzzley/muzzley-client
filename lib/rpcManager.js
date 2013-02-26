function rpcManager (socket, options) {
  // TODO implement options if passed
  this.TIMEOUT = 5000;
  this.socket = socket;
  this.cidCount = 0;
  this.requests = {};
}

rpcManager.prototype.handleResponse = function (message) {

  if (!message || !message.h || typeof message.h.cid === 'undefined') {
    // No Correlation Id defined, nothing to do here...
    return;
  }

  var correlationId = message.h.cid;

  if (correlationId in requests) {
    var entry = this.requests[correlationId];
    clearTimeout(entry.timeout);
    delete requests[correlationId];
    entry.callback(null, message);
  }

};

rpcManager.prototype.generateCid = function () {
  return ++this.cidCount;
};

// SaveRequest to handle the callback or to throw a error if timeout
rpcManager.prototype.saveRequest = function (message, responseCallback){
  var _this = this;
  var correlationId = this.generateCid();

  // Timeout 
  var tId = setTimeout(function (cid) {
    // If this ever gets called we didn't get a response in a timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + cid));
    // delete the entry from hash
    delete _this.requests[cid];
  }, _this.TIMEOUT, correlationId);

  // create a request entry to store in a hash
  var entry = {
    callback: responseCallback,
    timeout: tId // the id for the timeout so we can clear it
  };

  // Put the entry in the hash so we can match the response later
  _this.requests[correlationId] = entry;

};

// makeRequest function
rpcManager.prototype.makeRequest = function (message, responseCallback){
  saveRequest(message, responseCallback); //save the request

  var MESSAGE_TYPE_REQUEST = 1;
  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

  if (typeof message === 'object') {
    this.socket.send(JSON.stringify(message));
  } else {
    this.socket.send(message);
  }


};

module.exports = rpcManager;
