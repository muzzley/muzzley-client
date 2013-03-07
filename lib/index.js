var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.URI = options.uri;
  _this.socket = options.socket;

  return _this;

}

Muzzley.prototype.createActivity = function(opts, callback){
  var _this = this;

  //prepare "options" passed on arguments as "opts"
  var options = {};
  if (typeof opts === 'string'){
    options.token = opts;
  } else if (typeof opts === 'object') {
    if (opts.token)  options.token = opts.token;
    if (opts.activityId)  options.activityId = opts.activityId;
  } else {
    return callback('err');
  }

  _this.socket = new _this.socket('ws://platform.geo.muzzley.com:80/ws');

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    _this.remoteCalls.handShake(function(err, response){
      console.log("handshake");

      _this.remoteCalls.auth(options.token, function(err, response){
        console.log("auth");

        _this.remoteCalls.createActivity(options.activityId, function(err, response){
          console.log("createActivity");
          
          var activity = {
            activityId: response.d.activityId,
            qrCodeUrl: response.d.qrCodeUrl
          };
          return callback(null, activity);
        });
      });
    });
  };

  _this.socket.onmessage = function(message) {

    var MESSAGE_TYPE_REQUEST = 1;
    var MESSAGE_TYPE_RESPONSE = 2;
    var MESSAGE_TYPE_REQUEST_CORE = 3;
    var MESSAGE_TYPE_RESPONSE_CORE = 4;
    var MESSAGE_TYPE_SIGNAL = 5;

    // Just test if the message is well parsed or parsable
    if (typeof message.data !== 'object') {
      try {
        message = JSON.parse(message.data);
      } catch (e) {
        //console.log('Received an invalid non-JSON message. Ignoring.');
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

      // loop trought all participants 
      participants.forEach(function(participant){

        //Find the participant who sent the signal
        if (participant.userId === message.h.pid){

          //Emit the action of the participant
          participant.emit('action', message.d);
        }
      });
    }


    // If the message is a core Request
    if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){

      // if is a participant join 
      if (message.a ==='participantJoined'){

        //Create a new partcipant object
        var participant  = new Participant(
                                    message.d.participant.id,
                                    message.d.participant.name,
                                    message.d.participant.photoUrl
                                  );

        //Save the participant to participants array
        participants.push(participant);

        //Reply to the server with a success Response
        return rpcManager.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE_CORE, message.h.cid, participant.userId);
      }

      // If is a participant quit
      if (message.a ==='participantQuit'){

        // Loop trought all participants
        participants.forEach(function(participant){

          // Find the participant who quited the activity
          if (participant.userId === message.d.participantId){

            // override changeWidget method
            participant.changeWidget = function(){
              return "participant allready quited activity";
            };

            // Emit the quit event
            participant.emit('quit', message.a);
          }
        });
      }
    }


    if (message.h.t  === MESSAGE_TYPE_REQUEST){
      if (message.a ==='signal'){
        if (message.d.a === 'ready'){
          participants.forEach(function(participant){
            if (participant.userId === message.h.pid){
              actualActivity.emit('participantJoin', participant);
              return rpcManager.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid, message.h.pid);
            }
          });
        }
      }

    }

  };

  _this.socket.onclose = function()  {

  };

};


Muzzley.prototype.joinActivity = function(token, callback){

};


module.exports = Muzzley;