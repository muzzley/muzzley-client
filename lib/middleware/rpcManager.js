var TIMEOUT = 5000;
var cidCount = 0;
var requests = {};

//
// rpcManager middleware
//
function rpcManager (socket, options) {
  // TODO implement options if passed
  this.socket = socket;

}

// 
// rpcManager middlewareFunction
//
rpcManager.prototype.handleResponse = function (muzzData, next) {
  var MESSAGE_TYPE_RESPONSE = 2;
  //Verify if the muzzData is a response
  if (muzzData.h.t  === MESSAGE_TYPE_RESPONSE){
    if (!muzzData || !muzzData.h || typeof muzzData.h.cid === 'undefined') {
      // No Correlation Id defined, nothing to do here...
      return;
    }

    var correlationId = muzzData.h.cid;

    if (correlationId in requests) {
      var entry = requests[correlationId];
      clearTimeout(entry.timeout);
      delete requests[correlationId];

      //Check if the message is an error
      if (muzzData.s === false) return entry.callback(message.m);
      return entry.callback(null, muzzData);
    }
  }else{
    next(muzzData);
  }

};
rpcManager.prototype.makeRequest = function (message, responseCallback){
  var _this = this;

  // increment cid
  var correlationId = cidCount +=  1;

  // Timeout 
  var tId = setTimeout(function (cid) {
    // If this ever gets called we didn't get a response in a timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + cid));
    // delete the entry from hash
    delete requests[cid];
  }, TIMEOUT, correlationId);

  // create a request entry to store in a hash
  var entry = {
    callback: responseCallback,
    timeout: tId // the id for the timeout so we can clear it
  };

  // Put the entry in the hash so we can match the response later
  requests[correlationId] = entry;


  var MESSAGE_TYPE_REQUEST = 1;

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