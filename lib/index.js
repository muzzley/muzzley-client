var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.URI = options.uri;
  _this.socket = options.socket;

  return _this;

}

Muzzley.prototype.createActivity = function(token, callback){
  _this.socket = new _this.socket('ws://platform.geo.muzzley.com:80/ws');

  socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);
  };

  socket.onmessage = function(message) {

  };

  socket.onclose = function()  {

  };

};


Muzzley.prototype.joinActivity = function(token, callback){

};


module.exports = Muzzley;