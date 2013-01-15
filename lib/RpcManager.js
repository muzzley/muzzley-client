/**
 * Muzzley RPC Wrapper
 *
 * Based on http://stackoverflow.com/questions/10524613/how-to-create-rep-req-on-rabbit-js
 */

var TIMEOUT = 3000; // Time to wait for response in ms
var CONTENT_TYPE = 'application/json';

var CID_RANDOM_CHARS = 8;

/**
 *
 * @param {object} options An object with options:
 * - cidType: Either RpcManager.CID_TYPE_SEQUENTIAL or RpcManager.CID_TYPE_RANDOM.
 *            If not provided RpcManager.CID_TYPE_SEQUENTIAL will be used.
 * - cidRandomCharCount: The number of chars of the cid if the cidType is random.
 */
var RpcManager = function (options) {
  var self = this;
  var cidCount = 0;

  options = options || {};
  var cidType = options.cidType || RpcManager.CID_TYPE_SEQUENTIAL;

  this.generateCid = function () {
    return ++cidCount;
  };

  this.requests = {}; //hash to store request in wait for response
};

RpcManager.MESSAGE_TYPE_REQUEST = 1;
RpcManager.MESSAGE_TYPE_RESPONSE = 2;
RpcManager.MESSAGE_TYPE_REQUEST_CORE = 3;
RpcManager.MESSAGE_TYPE_RESPONSE_CORE = 4;
RpcManager.MESSAGE_TYPE_SIGNAL = 5;

RpcManager.CID_TYPE_SEQUENTIAL = 1;
RpcManager.CID_TYPE_RANDOM = 2;

/**
 *
 * @param {function} sendingFunction(message)
 * @param {function} responseCallback(err, message)
 */
RpcManager.prototype.makeRequest = function (message, connection, responseCallback) {
  var self = this;
  
  // Generate a unique correlation id for this call
  var correlationId = this.generateCid();

  // TODO The timeout function should be unique
  // Create a timeout for what should happen if we don't get a response
  var tId = setTimeout(function (cid) {
    // If this ever gets called we didn't get a response in a
    // timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + cid));
    // delete the entry from hash
    delete self.requests[cid];
  }, TIMEOUT, correlationId);

  // create a request entry to store in a hash
  var entry = {
    callback: responseCallback,
    timeout: tId //the id for the timeout so we can clear it
  };

  // Put the entry in the hash so we can match the response later
  self.requests[correlationId] = entry;

  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || RpcManager.MESSAGE_TYPE_REQUEST;

  var sendingFunc = connection.send || connection.write;
  if (typeof message === 'object') {
    connection.send(JSON.stringify(message));
  } else {
    connection.send(message);
  }
};

RpcManager.prototype.handleResponse = function (message) {
  var self = this;
 
  if (!message || !message.h || typeof message.h.cid === 'undefined') {
    // No Correlation Id defined, nothing to do here...
    return;
  }

  var correlationId = message.h.cid;

  if (correlationId in self.requests) {
    var entry = self.requests[correlationId];
    clearTimeout(entry.timeout);
    delete self.requests[correlationId];
    entry.callback(null, message);
  }
  

};

exports = module.exports = RpcManager;