function Muzzley (options) {
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