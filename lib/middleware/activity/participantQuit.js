//
// participantQuit middleware
//
function participantQuit(muzzData, next){

  var _this = this;
  if (muzzData.a === 'participantQuit') {

    var channel = _this.channelManager.get(muzzData.h.ch);
    var participant = channel.getActivity().getParticipant(muzzData.d.participantId);
    if (participant) {
      participant.trigger('quit', null);
      channel.getActivity().trigger('participantQuit', participant);
      channel.getActivity().removeParticipant(participant);
      return;
    }
  } else {
    next(muzzData);
  }

}

exports = module.exports = participantQuit;
