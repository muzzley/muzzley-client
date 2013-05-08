var Eventify = require('eventify');
var sockJs = require('sockjs-client');
var ev = require('event-stream');

function Muzzley (options) {

}


Muzzley.prototype.createActivity = function(opts, callback){
  var _this = this;

  _this.socket = new sockJs('http://platform.geo.muzzley.com/web');
  _this.socket.onopen = function()  {
    var stream = websocket(ws);
    console.log(stream);
  };
  
};


module.exports = Muzzley;