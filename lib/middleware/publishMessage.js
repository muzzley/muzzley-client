var messageTypes = require('../utils/messageTypes');
var PubSubMessage = require('../models/PubSubMessage');

//
//  publishMessage middleware
//  Intercepts custom publish messages
//
//  Emits events:
//  - message: function (type, data[, callback])
//    - callback: function (success[, message, data]).
//                Only if the message is an RPC request.
function publishMessage(muzzData, next){
  var _this = this;

  muzzData = muzzData || {};
  if (!muzzData.h || !muzzData.h.t || !muzzData.d) {
    return next(muzzData);
  }

  if (muzzData.a === 'publish') {
    var msgType = muzzData.h.t;

    var channel = _this.channelManager.get(muzzData.h.ch);

    var pubSubMessage = new PubSubMessage({ raw: muzzData });

    if (channel) {
      switch (msgType) {
        case messageTypes.MESSAGE_TYPE_REQUEST:
          // RPC message, requires a response

          // Temporary hack to contextualize all replies with
          // the IoT namespace.
          var contextualizedReplyData = JSON.parse(JSON.stringify(pubSubMessage.getRawMessageData()));

          channel.trigger('message', pubSubMessage, function (success, message, data) {

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

            var finalData = JSON.parse(JSON.stringify(data));
            if (contextualizedReplyData.ns === 'iot') {
              finalData.ns = contextualizedReplyData.ns;
              finalData.p = contextualizedReplyData.p || {};
              finalData.p.io = 'i';
              finalData.p.data = data;
            }

            _this.remoteCalls.response(muzzData.h, success, message, finalData);
          });
          return;
        case messageTypes.MESSAGE_TYPE_SIGNAL:
          channel.trigger('message', pubSubMessage);
          return;
      }
    }
  }

  return next(muzzData);
}

