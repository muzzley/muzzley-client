var Participant = require('../../models/Participant');
//Protocol message codes
var messageTypes = require('../../utils/messageTypes');

function getPendingParticipantsKey(channel, participantId) {
  return [channel.id, participantId].join('_');
}

//
// participantJoined middleware builder
//
function createMiddleware() {

  // Make sure to warn the developer if he's using this middleware by referencing
  // this function directly instead of calling the function and using the returned func.

  if (arguments && arguments[0]) {
    throw new Error('The "participantJoin" middleware must be included through a function call');
  }

  var notReadyParticipants = {};

  return function participantJoined(muzzData, next) {
    var _this = this;
    var participant = null;
    var pendingParticipantKey = null;
    var channel = _this.channelManager.get(muzzData.h.ch);
    if (muzzData.h.t === messageTypes.MESSAGE_TYPE_REQUEST && muzzData.a === 'signal' && muzzData.d.a === 'ready') {
      // A `ready` signal for the joined participant

      // Find the participant object to trigger the event of 'participantJoin'
      // check the pid with our participant
      pendingParticipantKey = getPendingParticipantsKey(channel, muzzData.h.pid);
      participant = notReadyParticipants[pendingParticipantKey];
      if (participant){
        channel.getRemoteCalls().successResponse(muzzData.h);
        channel.getActivity().addParticipant(participant);
        delete notReadyParticipants[pendingParticipantKey];

        _this.trigger('participantJoin', participant);
        channel.getActivity().trigger('participantJoin', participant);
        return;
      }

    } else if (muzzData.h.t === messageTypes.MESSAGE_TYPE_REQUEST_CORE && muzzData.a === 'participantJoined') {
      // A `participantJoined` signal

      participant = Participant.fromMessage(muzzData.d.participant, channel.getRemoteCalls());
      pendingParticipantKey = getPendingParticipantsKey(channel, participant.id);
      notReadyParticipants[pendingParticipantKey] = participant;

      channel.getRemoteCalls().successResponse(muzzData.h);
      return;
    } else {
      next(muzzData);
    }
  };

}

exports = module.exports = createMiddleware;