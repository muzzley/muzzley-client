var commons = require('./commons.js');
var messageTypes = require('../utils/messageTypes');

//
// Remotes calls
function RemoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}

RemoteCalls.prototype.handshake = commons.handshake;

RemoteCalls.prototype.authUser = function(userToken, callback){
  var authUser = {
    a: 'loginUser',
    d: {
      token: userToken
    }
  };
  this.rpcManager.makeRequest(authUser, callback);
};

RemoteCalls.prototype.joinActivity = function(activityId, callback){
  var joinActivity = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };
  this.rpcManager.makeRequest(joinActivity, callback);
};

RemoteCalls.prototype.sendReady = function(callback){
  var sendReady = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };
  this.rpcManager.makeRequest(sendReady, callback);
};

RemoteCalls.prototype.successResponse = commons.successResponse;

RemoteCalls.prototype.response = commons.response;

RemoteCalls.prototype.sendWidgetData = function (data){
  var msg = {
    h: {
      t: messageTypes.MESSAGE_TYPE_SIGNAL
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

RemoteCalls.prototype.quit = commons.quit;

RemoteCalls.prototype.sendSignal = commons.sendSignal;

RemoteCalls.prototype.sendSharingInvitation = commons.sendSharingInvitation;
RemoteCalls.prototype.fileShareInvitationResponse = commons.fileShareInvitationResponse;
RemoteCalls.prototype.shareFile = commons.shareFile;
RemoteCalls.prototype.sharingCancel = commons.sharingCancel;
RemoteCalls.prototype.sharingEnd = commons.sharingEnd;

module.exports = RemoteCalls;