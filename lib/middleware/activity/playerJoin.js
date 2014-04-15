var Participant = require('../../models/Participant');

//Protocol message codes
var messageTypes = require('../../utils/messageTypes');

//
// PlayerJoin middleware
//
function createMiddleware() {

  // Make sure to warn the developer if he's using this middleware by referencing
  // this function directly instead of calling the function and using the returned func.

  if (arguments && arguments[0]) {
    throw new Error('The "playerJoin" middleware must be included through a function call');
  }

  var notReadyParticipants = {};

  return function playerJoin(muzzData, next){
    var _this = this;
    // if is a ready signal of the 'participantJoin'
    if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST && muzzData.a ==='signal' && muzzData.d.a === 'ready'){
      // Find the participant object to trigger the event of 'participantJoin'
      // check the pid with our participant
      if (notReadyParticipants[muzzData.h.pid]){
        _this.remoteCalls.successResponse(muzzData.h);
        _this.participants[muzzData.h.pid] = notReadyParticipants[muzzData.h.pid];
        delete notReadyParticipants[muzzData.h.pid];

        _this.trigger("participantJoin", _this.participants[muzzData.h.pid]);
        _this.activity.trigger("participantJoin", _this.participants[muzzData.h.pid]);
        return;

      }

    // else if is a participant join 
    } else if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST_CORE && muzzData.a ==='participantJoined'){

      // Copy all the properties of the participant dynamically
      var participantProps = {};
      for(var key in muzzData.d.participant) {
        participantProps[key] = muzzData.d.participant[key];
      }
      participantProps._remoteCalls = _this.remoteCalls;

      //Create a new partcipant object
      var participant = new Participant(participantProps);

      notReadyParticipants[participant.id] = participant;
      _this.remoteCalls.successResponse(muzzData.h);
      return;
    }else{
      next(muzzData);
    }
  };

}

module.exports = createMiddleware;