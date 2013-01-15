var sockjs = require('sockjs-client');
var RpcManager = require('./RpcManager');
var rpcManager;


// Constructor function
var socket = function (options) {
  //TODO Something with options
  var self = this;
  self.sock = sockjs('http://localhost:9292/ws');

  this.sock.onopen = function() {
    rpcManager = new RpcManager({sock:self.sock});
    var remoteCalls = rpcManager.remoteCalls;

    remoteCalls.handshake(function(err, response){
      console.log("handshake");

      remoteCalls.auth(function(err, response){
        console.log("auth");

        remoteCalls.createActivity(function(err, response){
          console.log("createActivity");
        });

      });

    });
  };

  this.sock.onmessage = function(e) {
    console.log("Message/Response received:");
    var message = e.data;
    console.log(message);

    if (typeof message !== 'object') {
      try {
        message = JSON.parse(message);
      } catch (e) {
        console.log('Received an invalid non-JSON message. Ignoring.');
        console.log(e);
        return;
      }
    }
    var MESSAGE_TYPE_REQUEST = 1;
    var MESSAGE_TYPE_RESPONSE = 2;
    var MESSAGE_TYPE_REQUEST_CORE = 3;
    var MESSAGE_TYPE_RESPONSE_CORE = 4;
    var MESSAGE_TYPE_SIGNAL = 5;

    if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){

    }

    if (message.h.t  === MESSAGE_TYPE_RESPONSE){
        rpcManager.handleResponse(message);
    }




  };

  this.sock.onclose   = function()  {
    console.log("close");
  };

};

module.exports = socket;
