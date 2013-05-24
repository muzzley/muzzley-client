//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}


remoteCalls.prototype.handshake = function(callback){
  var handshakeJSON = {
    a: 'handshake',
    d: {
      // Mandatory
      protocolVersion: '1.0',
      // All the following are optional and experimental
      lib: 'nodejs',
      userAgent: 'muzzley-client',
      connection: 'LAN',
      contentType: 'application/json'
    }
  };
  this.rpcManager.makeRequest(handshakeJSON, callback);

};
remoteCalls.prototype.authUser = function(callback){
  var authUser = {
    a: 'loginUser',
    d: {
      token: userToken //TODO: Token passed in opts
    }
  };
  this.rpcManager.makeRequest(authUser, callback);
};

remoteCalls.prototype.joinActivity = function(callback){
  var joinActivity = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };
  this.rpcManager.makeRequest(joinActivity, callback);
};


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