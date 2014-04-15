//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

var TIMEOUT = 10000;

//
// rpcManager middleware
//
function rpcManager (socket, options) {
  // TODO implement options if passed
  this.socket = socket;
  this.requests = {};
  this.cidCount = 0;
}

// 
// rpcManager middlewareFunction
//
rpcManager.prototype.handleResponse = function (muzzData, next) {
  var _this = this;

  //Verify if the muzzData is a response
  if (muzzData.h.t  === MESSAGE_TYPE_RESPONSE){
    if (!muzzData || !muzzData.h || typeof muzzData.h.cid === 'undefined') {
      // No Correlation Id defined, nothing to do here...
      return;
    }

    var correlationId = muzzData.h.cid;

    if (correlationId in _this.requests) {
      var entry = _this.requests[correlationId];
      clearTimeout(entry.timeout);
      delete _this.requests[correlationId];

      //Check if the message is an error and is not a redirect (connectTo)
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
rpcManager.prototype.makeRequest = function (message, responseCallback){
  var _this = this;

  // increment cid
  var correlationId = _this.cidCount +=  1;

  // Timeout 
  var tId = setTimeout(function (cid) {
    // If this ever gets called we didn't get a response in a timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + cid));
    // delete the entry from hash
    delete _this.requests[cid];
  }, TIMEOUT, correlationId);

  // create a request entry to store in a hash
  var entry = {
    callback: responseCallback,
    timeout: tId // the id for the timeout so we can clear it
  };

  // Put the entry in the hash so we can match the response later
  _this.requests[correlationId] = entry;


  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

  if (typeof message === 'object') {
    _this.socket.send(JSON.stringify(message));
  } else {
    _this.socket.send(message);
  }
};


module.exports = rpcManager;
