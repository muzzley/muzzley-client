var Eventify = require('eventify');

//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;


module.exports = function (message) {
  var _this = this;

  // Just test if the message is well parsed or parsable
  if (typeof message.data !== 'object') {
    try {
      message = JSON.parse(message.data);
    } catch (e) {
      console.log('Received an invalid non-JSON message. Ignoring.');
      //console.log(e);
      return;
    }
  }

  // If the message is a Response it need to be handled by the rpcManager
  if (message.h.t  === MESSAGE_TYPE_RESPONSE){
    return _this.rpcManager.handleResponse(message);
  }

  // If the message is a signal
  if (message.h.t  === MESSAGE_TYPE_SIGNAL){

    if (message.d.w === 'hb') {
      //{"h":{"t":5},"a":"signal","d":{"w":"hb","c":"hb","v":"hb","e":"hb"}}
      if(_this.logMessages) console.log('##Activity heartBeat');
      return;
    }
    // loop trought all participants 
    _this.participants.forEach(function(participant){

      //Find the participant who sent the signal
      if (participant.id === message.h.pid){

        //Emit the action of the participant
        participant.trigger('action', message.d);
      }
    });
  }


  // If the message is a core Request
  if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){
    // if is a participant join 
    if (message.a ==='participantJoined'){
      if(_this.logMessages) console.log('##Activity: Recived ParticipantJoined');
      //Create a new partcipant object
      var participant  = (function (_this) {
        return {
          id: message.d.participant.id,
          name: message.d.participant.name,
          photoUrl: message.d.participant.photoUrl,
          changeWidget:function(widget, callback) {
            if(_this.logMessages) console.log('##Activity request to changeWidget');
            _this.remoteCalls.changeWidget(widget, this.id, callback);
          }
        };
      }(_this));

      // Enable Events on activity
      Eventify.enable(participant);

      //Save the participant to participants array
      _this.participants.push(participant);

      // Reply to the server with a success Response
      //
      // ATTENTION:doesnt emit the 'participantJoin' event 
      // it will be triggered down on a MESSAGE_TYPE_REQUEST event from the server
      if(_this.logMessages) console.log('##Activity: Sending joined Notification');
      return _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE_CORE, message.h.cid, participant.id);
    }

    // If is a participant quit
    if (message.a ==='participantQuit'){

      // Loop trought all participants
      _this.participants.forEach(function(participant){

        // Find the participant who quited the activity
        if (participant.id === message.d.participantId){

          // override changeWidget method
          participant.changeWidget = function(){
            return "participant allready quited activity";
          };

          // Emit the quit event
          participant.trigger('quit', message.a);
          return _this.activity.trigger('participantQuit', participant);
        }
      });
    }
  }

  // Check if the message is a request
  if (message.h.t  === MESSAGE_TYPE_REQUEST){
    // if the request is a signal
    if (message.a ==='signal'){

      // if is a ready signal of the 'participantJoin'
      if (message.d.a === 'ready'){
        if(_this.logMessages) console.log('##Activity: Participant Ready Notification Received');
        //loop trought all participants to Find the participant object to trigger the event of 'participantJoin'
        _this.participants.forEach(function(participant){
          // check the pid with our participant
          if (participant.id === message.h.pid){
            // Send a success response back
            if(_this.logMessages) console.log('##Activity: Sending Ready Notification Response');
            _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid, message.h.pid);
            // Emit the 'participantJoin' event
            if(_this.logMessages) console.log('##Activity: trigger "participantJoin" event');
            return _this.activity.trigger('participantJoin', participant);
          }
        });
      }

      if (message.d.a === 'changeWidget') {
        if(_this.logMessages) console.log('##User: Recived changeWidget request');
        if(_this.logMessages) console.log('##User: Sending changeWidget success Response');
        _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid);

        if(_this.logMessages) console.log('##User: trigger "changeWidget" event');
        return _this.user.trigger('changeWidget', message.d.d);
      }

    }
  }
};