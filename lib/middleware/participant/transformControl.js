var messageTypes = require('../../utils/messageTypes');

//
// PlayerJoin middleware
//
function transformControl(muzzData, next){
  var _this = this;
  // if is a transform control unit request
  if (muzzData.h.t === messageTypes.MESSAGE_TYPE_REQUEST && muzzData.a === 'signal' && muzzData.d.a ==='changeWidget'){
    var channel = _this.channelManager.get(muzzData.h.ch);
    if (channel && channel.user) {
      channel.getRemoteCalls().successResponse(muzzData.h);
      _this.trigger('changeWidget', muzzData.d.d); // backward compatibility
      channel.user.trigger('changeWidget', muzzData.d.d);
    }
  }else{
    next(muzzData);
  }

}

module.exports = transformControl;