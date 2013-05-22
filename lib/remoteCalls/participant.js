//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}


remoteCalls.prototype.successResponse = function(originalHeader){
  //Protocol message codes
  var MESSAGE_TYPE_REQUEST = 1;
  var MESSAGE_TYPE_RESPONSE = 2;
  var MESSAGE_TYPE_REQUEST_CORE = 3;
  var MESSAGE_TYPE_RESPONSE_CORE = 4;

  var msg = {
    h: originalHeader,
    s: true
  };

  if (originalHeader.t === MESSAGE_TYPE_REQUEST) {
    msg.h.t = MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = MESSAGE_TYPE_RESPONSE_CORE;
  }

  this.socket.send(JSON.stringify(msg));

};

remoteCalls.prototype.sendWidgetData= function (data){
  var msg = {
    h: {
      t: 5
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.quit = function (data){
  var quit = {
    a: 'quit'
  };

  this.rpcManager.makeRequest(quit, function(err, muzzData){
    console.log(muzzData);
  });
};

module.exports = remoteCalls;