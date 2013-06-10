var messageTypes = require('../utils/messageTypes');

//
//  signalingMessage middleware
//  Intercepts custom signaling messages
//
//  Emits events:
//  - signalingMessage: function (type, data[, callback])
//    - callback: function (success[, message, data]).
//                Only if the message is an RPC request.
function signalingMessage(muzzData, next){
  var _this = this;

  muzzData = muzzData || {};
  if (!muzzData.h || !muzzData.h.t) {
    return next(muzzData);
  }

  if (muzzData.a === 'signal' && muzzData.d.a !== undefined) {
    var msgType = muzzData.h.t;

    var participant = false;
    if (_this.participants && _this.participants[muzzData.h.pid]) {
      // Activity master middleware
      participant = _this.participants[muzzData.h.pid];
    } else {
      // User/participant middleware
      participant = _this.participant;
    }

    if (participant) {
      switch (msgType) {
        case messageTypes.MESSAGE_TYPE_REQUEST:
          // RPC message, requires a response
          participant.trigger('signalingMessage', muzzData.d.a, muzzData.d.d, function (success, message, data) {
            _this.remoteCalls.response(muzzData.h, success, message, data);
          });
          return;
        case messageTypes.MESSAGE_TYPE_SIGNAL:
          participant.trigger('signalingMessage', muzzData.d.a, muzzData.d.d);
          return;
      }
    }
  }

  return next(muzzData);
}

module.exports = signalingMessage;