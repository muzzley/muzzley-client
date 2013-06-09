var Eventify = require('eventify');

//Protocol message codes
var messageTypes = require('../../utils/messageTypes');


var notReadyParticipants = {};
//
// PlayerJoin middleware
//
function playerJoin(muzzData, next){
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
  }else if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST_CORE && muzzData.a ==='participantJoined'){
    //Create a new partcipant object
    var participant  = {
      id: muzzData.d.participant.id,
      name: muzzData.d.participant.name,
      photoUrl: muzzData.d.participant.photoUrl,
      changeWidget:function(widget, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          _this.remoteCalls.changeWidget(widget, this.id, callback);
        } else {
          _this.remoteCalls.changeWidget(widget, params, this.id, callback);
        }
      },
      setupComponent:function(component, callback) {
        _this.remoteCalls.setupComponent(component, this.id, callback);
      },
      sendSignal: function (type, data, callback) {
        _this.remoteCalls.sendSignal(type, data, this.id, callback);
      }
    };

    //Enable events
    Eventify.enable(participant);

    notReadyParticipants[participant.id] = participant;
    _this.remoteCalls.successResponse(muzzData.h);
    return;
  }else{
    next(muzzData);
  }
}

module.exports = playerJoin;