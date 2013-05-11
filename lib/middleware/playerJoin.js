var Eventify = require('eventify');

//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;


var notReadyParticipants = {};
//
// PlayerJoin middleware
//
function playerJoin(muzzData, next){
  var _this = this;
  // if is a ready signal of the 'participantJoin'
  if (muzzData.h.t  === MESSAGE_TYPE_REQUEST && muzzData.a ==='signal' && muzzData.d.a === 'ready'){
    console.log('ready');
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
  }else if (muzzData.h.t  === MESSAGE_TYPE_REQUEST_CORE && muzzData.a ==='participantJoined'){
    //Create a new partcipant object
      var participant  = {
        id: muzzData.d.participant.id,
        name: muzzData.d.participant.name,
        photoUrl: muzzData.d.participant.photoUrl,
        changeWidget:function(widget, params, callback) {
          var msg = {
            h: {},
            a: 'signal',
            d: {
              a: 'changeWidget',
              d: {}
            }
          };

          if (typeof widget === 'string') {
            // Define the widget name
            msg.d.d.widget = widget;
          } else if (typeof widget === 'object') {
            // The whole `d` object was provided
            msg.d.d = widget;
          }

          if (typeof params === 'object') {
            // The `params` object has been provided
            msg.d.d.params = params;
          } else {
            // `params` was not provided, shift the other arguments
            callback = params;
          }


          msg.h.pid = this.id;

          _this.rpcManager.makeRequest(msg, callback);
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