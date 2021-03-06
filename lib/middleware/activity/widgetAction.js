//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// widgetAction middleware
//
function widgetAction(muzzData, next){
  var _this = this;
  // if is a ready signal of the 'participantJoin'
  if (muzzData.h.t  === MESSAGE_TYPE_SIGNAL && muzzData.h.pid && muzzData.d.a === undefined ){
    
    var channel = _this.channelManager.get(muzzData.h.ch);
    var participant = channel.getActivity().getParticipant(muzzData.h.pid);
    if(participant){
      participant.trigger('action', muzzData.d);
      next(muzzData);
    }

  } else {
    next(muzzData);
  }
}

exports = module.exports = widgetAction;