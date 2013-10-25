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
  if (!muzzData.h || !muzzData.h.t || !muzzData.d) {
    return next(muzzData);
  }

  if (muzzData.a === 'signal' && muzzData.d.a !== undefined) {
    var msgType = muzzData.h.t;
    var signalData = (typeof muzzData.d.d === undefined) ? null : muzzData.d.d;

    var participant = _this._user || _this.participants[muzzData.h.pid];
    if (participant) {
      switch (msgType) {
        case messageTypes.MESSAGE_TYPE_REQUEST:
          // RPC message, requires a response
          participant.trigger('signalingMessage', muzzData.d.a, signalData, function (success, message, data) {

            if (typeof success === 'boolean') {

              if (typeof message === 'object' && arguments.length === 2) {
                // (success, data) provided
                data = message;
                message = '';
              }

            } else if (typeof success === 'string') {
              // (message, data) provided
              data = message;
              message = success;
              success = true;
            } else if (typeof success === 'object') {
              // (data) provided
              data = success;
              message = '';
              success = true;
            } else {
              // No arguments provided
              data = {};
              message = '';
              success = true;
            }

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
