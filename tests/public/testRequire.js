;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){var muzzley = require('muzzley-sdk-js');
},{"muzzley-sdk-js":2}],2:[function(require,module,exports){function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed
  var URI = ' ';
  
  _this.socket = new SockJS(URI);

  socket.onopen = function()  {
    _this.rpcManager = new require('./lib/rpcManager.js')(_this.socket);
    _this.remoteCalls = new require('./lib/remoteCalls.js')(_this.socket, _this.rpcManager);
  };

  socket.onmessage = function(message) {
  
  };

  socket.onclose   = function()  {
  
  };


}

module.exports = Muzzley;
},{}]},{},[1]);