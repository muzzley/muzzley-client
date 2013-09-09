var messageTypes = require('../../utils/messageTypes');

//
// Activity Terminated event middleware
//
function setupComponent(muzzData, next) {
  var _this = this;
  // Check if it is a setupComponent request
  if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST_CORE && muzzData.a === 'activityTerminated') {
    //Check if the player exists
    if (_this.participant) {
      _this.trigger('activityTerminated');
      _this.participant.trigger('activityTerminated');
    }
  } else {
    next(muzzData);
  }
}

module.exports = setupComponent;