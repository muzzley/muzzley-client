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
      // Received a potentially invalid non-JSON message. Ignoring.
      // It might also be a heartbeat
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
      _this.log('##Activity heartBeat');
      return;
    }
    //Find the participant who sent the signal
    if (_this.participants[message.h.pid]){

      //Emit the action of the participant
      _this.participants[message.h.pid].trigger('action', message.d);
    }
  }


  // If the message is a core Request
  if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){
    // if is a participant join 
    if (message.a ==='participantJoined'){
      _this.log('##Activity: Recived ParticipantJoined');
      //Create a new partcipant object
      var participant  = (function (_this) {
        return {
          id: message.d.participant.id,
          name: message.d.participant.name,
          photoUrl: message.d.participant.photoUrl,
          changeWidget:function(widget, params, callback) {
            _this.log('##Activity request to changeWidget');
            if (typeof params === 'function') {
              callback = params;
              _this.remoteCalls.changeWidget(widget, this.id, callback);
            } else {
              _this.remoteCalls.changeWidget(widget, params, this.id, callback);
            }
          }
        };
      }(_this));

      // Enable Events on activity
      Eventify.enable(participant);

      //Save the participant to participants
      _this.participants[participant.id] = participant;

      // Reply to the server with a success Response
      //
      // ATTENTION:doesnt emit the 'participantJoin' event 
      // it will be triggered down on a MESSAGE_TYPE_REQUEST event from the server
      _this.log('##Activity: Sending joined Notification');
      return _this.remoteCalls.successResponse(message.h);
    }

    // If is a participant quit
    if (message.a ==='participantQuit'){

      // Find the participant who quited the activity
      if (_this.participants[message.d.participantId]){

        // override changeWidget method
        _this.participants[message.d.participantId].changeWidget = function(){
          return "participant allready quited activity";
        };

        // Emit the quit event
        _this.participants[message.d.participantId].trigger('quit', message.a);
        return _this.activity.trigger('participantQuit', _this.participants[message.d.participantId]);
      }

    }
  }

  // Check if the message is a request
  if (message.h.t  === MESSAGE_TYPE_REQUEST){
    // if the request is a signal
    if (message.a ==='signal'){

      // if is a ready signal of the 'participantJoin'
      if (message.d.a === 'ready'){
        _this.log('##Activity: Participant Ready Notification Received');

        //Find the participant object to trigger the event of 'participantJoin'
        // check the pid with our participant
        if (_this.participants[message.h.pid]){
          // Send a success response back
          _this.log('##Activity: Sending Ready Notification Response');
          _this.remoteCalls.successResponse(message.h);
          // Emit the 'participantJoin' event
          _this.log('##Activity: trigger "participantJoin" event');
          return _this.activity.trigger('participantJoin', _this.participants[message.h.pid]);
        }

      }

      if (message.d.a === 'changeWidget') {
        _this.log('##User: Recived changeWidget request');
        _this.log('##User: Sending changeWidget success Response');
        _this.remoteCalls.successResponse(message.h);

        _this.log('##User: trigger "changeWidget" event');
        return _this.user.trigger('changeWidget', message.d.d);
      }

    }
  }
};