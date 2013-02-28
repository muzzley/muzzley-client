require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{"muzzley-sdk-js":[function(require,module,exports){module.exports = require('Ic3A6R');
},{}],"Ic3A6R":[function(require,module,exports){var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed
  var URI = ' ';
  
  _this.socket = new SockJS(URI);

  socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);
  };

  socket.onmessage = function(message) {
  
  };

  socket.onclose   = function()  {
  
  };


}

module.exports = Muzzley;
},{"./rpcManager.js":1,"./remoteCalls.js":2}],1:[function(require,module,exports){function rpcManager (socket, options) {
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

},{}],2:[function(require,module,exports){function remoteCalls (socket, rpcManager, options) {
  // TODO implement options if passed
  this.rpcManager = rpcManager;
  this.socket = socket;
}


remoteCalls.prototype.handShake = function(callback){

  var msg = {
    a: 'handshake',
    d: {
      // Mandatory
      protocolVersion: '1.0',
      // All the following are optional and experimental
      lib: 'nodejs',
      userAgent: 'muzzley-sdk-js',
      connection: 'LAN',
      contentType: 'application/json'
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.auth = function (token, callback) {
  var msg = {
    'a': 'loginUser',
    'd': {
      'token': token
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.createActivity = function (activityId, callback){
  var msg = {
    a: 'create',
    d: {
      protocolVersion: '1.0',
      lib: 'js',
      libVersion: '0.1',
      activityId: activityId
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.changeWidget = function (widget, pid, callback){
  var msg = {
    h: {
      pid: pid
    },
    a: 'signal',
    d: {
      a: 'changeWidget',
      d:{
        widget: widget
      }
    }
  };
  this.rpcManager.makeRequest(msg, this.sock, callback);
};

remoteCalls.prototype.joinActivity = function (activityId, callback) {
  var msg = {
    'a': 'join',
    'd': {
      'activityId': activityId
    }
  };
  this.rpcManager.makeRequest(msg, this.ws, callback);
};

remoteCalls.prototype.sendReady = function (callback) {
  var msg = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };

  this.rpcManager.makeRequest(msg, this.ws, callback);
};

remoteCalls.prototype.successResponse = function (type, cid, pid){
  var msg = {
    h: {t: type, cid: cid},
    s: true
  };

  if (pid) {
    msg.h.pid = pid;
  }

  console.log(msg);
  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.sendSignal = function (actionObj){
  var msg  = {
    h: {
      t: 5
    },
    a: 'signal',
    d: actionObj
  };
  this.socket.send(JSON.stringify(msg));
};
},{}],3:[function(require,module,exports){muzzley = require('muzzley-sdk-js');

},{"muzzley-sdk-js":"Ic3A6R"}]},{},[3]);