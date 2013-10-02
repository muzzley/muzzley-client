var commons = require('./commons.js');
var messageTypes = require('../utils/messageTypes');

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

remoteCalls.prototype.response = commons.response;

remoteCalls.prototype.sendWidgetData = function (data){
  var msg = {
    h: {
      t: messageTypes.MESSAGE_TYPE_SIGNAL
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

remoteCalls.prototype.sendSignal = commons.sendSignal;

module.exports = remoteCalls;