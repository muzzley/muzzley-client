var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.URI = options.uri;
  _this.socket = options.socket;
  _this.participants = [];
  _this.activity = undefined;
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

  _this.socket = new _this.socket(_this.URI);

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    _this.remoteCalls.handShake(function(err, response){
      console.log("handshake");

      _this.remoteCalls.auth(options.token, function(err, response){
        console.log("auth");

        _this.remoteCalls.createActivity(options.activityId, function(err, response){
          console.log("createActivity");

          //Create the activity object
          var activity = {
            activityId: response.d.activityId,
            qrCodeUrl: response.d.qrCodeUrl
          };

          // Enable Events on activity
          Eventify.enable(activity);

          // Add the activity object to the current context _this
          _this.activity = activity;

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
      //{"h":{"t":5},"a":"signal","d":{"w":"hb","c":"hb","v":"hb","e":"hb"}}

      if (message.d.w === 'hb') return console.log('hb');

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

        //Create a new partcipant object
        var participant  = (function (_this) {
          return {
            id: message.d.participant.id,
            name: message.d.participant.name,
            photoUrl: message.d.participant.photoUrl,
            changeWidget:function(widget, callback) {
              _this.remoteCalls.changeWidget(widget, this.id, callback);
            }
          };
        }(_this));

        // Enable Events on activity
        Eventify.enable(participant);

        //Save the participant to participants array
        _this.participants.push(participant);
        //console.log(_this.participants);
        //Reply to the server with a success Response
        return _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE_CORE, message.h.cid, participant.userId);
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
            _this.activity.trigger('participantQuit', participant);
          }
        });
      }
    }


    if (message.h.t  === MESSAGE_TYPE_REQUEST){
      if (message.a ==='signal'){
        if (message.d.a === 'ready'){
          _this.participants.forEach(function(participant){
            if (participant.id === message.h.pid){
              _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid, message.h.pid);
              return _this.activity.trigger('participantJoin', participant);
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