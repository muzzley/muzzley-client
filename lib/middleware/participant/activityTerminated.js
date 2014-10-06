var messageTypes = require('../../utils/messageTypes');

//
// Activity Terminated event middleware
//
function activityTerminated(muzzData, next) {
  var _this = this;
  // Check if it is a setupComponent request
  if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST_CORE && muzzData.a === 'activityTerminated') {
    var channel = _this.channelManager.get(muzzData.h.ch);
    if (channel && channel.user) {
      _this.trigger('activityTerminated');
      channel.user.trigger('activityTerminated');
    }
  } else {
    next(muzzData);
  }
}

module.exports = activityTerminated;