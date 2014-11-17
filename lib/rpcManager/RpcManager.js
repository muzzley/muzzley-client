//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

var TIMEOUT = 10000;

function RpcManager (options) {
  options = options || {};

  this.send = options.send;
  this.requests = {};
  this.cidCount = 0;
}

// 
// RpcManager's middleware function
//
RpcManager.prototype.handleResponse = function (muzzData, next) {
  var self = this;

  //Verify if the muzzData is a response
  if (muzzData.h.t  === MESSAGE_TYPE_RESPONSE) {
    if (!muzzData || !muzzData.h || typeof muzzData.h.cid === 'undefined') {
      // No Correlation Id defined, nothing to do here...
      return;
    }

    var correlationId = muzzData.h.cid;

    if (correlationId in self.requests) {
      var entry = self.requests[correlationId];
      clearTimeout(entry.timeout);
      delete self.requests[correlationId];

      // Check if the message is an error and is not a redirect (connectTo)
      var isRedirect = muzzData.d && muzzData.d.connectTo;
      if (muzzData.s === false && !isRedirect) {
        var errMsg = muzzData.m || 'Unknown error';
        return entry.callback(new Error(errMsg), muzzData);
      }
      return entry.callback(null, muzzData);
    }

  }else{
    next(muzzData);
  }
};

RpcManager.prototype.makeRequest = function (message, responseCallback){
  var self = this;

  if (typeof responseCallback !== 'function') {
    responseCallback = function () {};
  }

  var correlationId = self.cidCount +=  1;

  // Timeout 
  var tId = setTimeout(function () {
    // If this ever gets called we didn't get a response in a timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + correlationId));
    delete self.requests[correlationId];
  }, TIMEOUT);

  // Create a request entry to store in a hash
  // so we can match the response later
  var entry = {
    callback: responseCallback,
    timeout: tId
  };
  self.requests[correlationId] = entry;

  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

  try {
    this.send(message);
  } catch (e) {
    return responseCallback(new Error('Error sending message: ' + e));
  }
};

module.exports = RpcManager;