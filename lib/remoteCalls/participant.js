var commons = require('./commons.js');

//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}

remoteCalls.prototype.handshake = commons.handshake;

remoteCalls.prototype.authUser = function(userToken, callback){
  var authUser = {
    a: 'loginUser',
    d: {
      token: userToken
    }
  };
  this.rpcManager.makeRequest(authUser, callback);
};

remoteCalls.prototype.joinActivity = function(activityId, callback){
  var joinActivity = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };
  this.rpcManager.makeRequest(joinActivity, callback);
};

remoteCalls.prototype.sendReady = function(callback){
  var sendReady = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };
  this.rpcManager.makeRequest(sendReady, callback);
};

remoteCalls.prototype.successResponse = commons.successResponse;

remoteCalls.prototype.sendWidgetData = function (data){
  var msg = {
    h: {
      t: 5
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.quit = function (data, callback){
  var quit = {
    a: 'quit'
  };

  this.rpcManager.makeRequest(quit, callback);
};

module.exports = remoteCalls;