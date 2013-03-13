var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.endPoint = options.endPoint;
  _this.socket = options.socket;
  _this.participants = [];
  _this.activity = undefined;
  _this.user = undefined;
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

  _this.socket = new _this.socket(_this.endPoint);

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    console.log('##Activity: sending handShake');
    _this.remoteCalls.handShake(function(err, response){
      console.log('##Activity: handshaked');

      console.log('##Activity: sending authApp');
      _this.remoteCalls.authApp(options.token, function(err, response){
        console.log('##Activity: Authenticaded');

        console.log('##Activity: sending createActivity');
        _this.remoteCalls.createActivity(options.activityId, function(err, response){
          console.log('##Activity: Activity Created');

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
    console.log('##Activity MessageRecived:');
    console.log(message);

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
      //{"h":{"t":5},"a":"signal","d":{"w":"hb","c":"hb","v":"hb","e":"hb"}}
      if (message.d.w === 'hb') return console.log('##Activity heartBeat');

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
              console.log('requestTo changeWidget');
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
        console.log('##Activity ParticipantJoined, Sending Ready Notification');
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
          console.log('##Activity: Participant Ready Notification Received');
          //loop trought all participants to Find the participant object to trigger the event of 'participantJoin'
          _this.participants.forEach(function(participant){
            // check the pid with our participant
            if (participant.id === message.h.pid){
              // Send a success response back
              console.log('##Activity: Sending Ready Notification Response');
              _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid, message.h.pid);
              // Emit the 'participantJoin' event
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


Muzzley.prototype.joinActivity = function(userToken, activityId, callback){
  var _this = this;

  _this.socket = new _this.socket(_this.endPoint);

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    console.log('##User: sending handShake');
    _this.remoteCalls.handShake(function(err, response){
      console.log('##User: handShaked');
      console.log('##User: sending authUser');
      _this.remoteCalls.authUser(userToken, function(err, response){
        console.log('##User: user Authenticaded');

        console.log('##User: sending joinActivity');
        _this.remoteCalls.joinActivity(activityId, function(err, response){
          console.log('##User: joined Activity');

          //Create the participant object
          var participant = {
            id: response.participant.id,
            name: response.participant.name,
            photoUrl: response.participant.photoUrl
          };

          // Enable Events on activity
          Eventify.enable(participant);

          // Add the activity object to the current context _this
          _this.user = participant;

          return _this.remoteCalls.sendReady(function(){
            callback(null, _this.user);
          });
        });
      });
    });
  };

  _this.socket.onmessage = function(message) {
    console.log('##User MessageRecived:');
    console.log(message);

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

    if (message.h.t  === MESSAGE_TYPE_REQUEST){
      if (message.d.a === 'changeWidget') {
        _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid);
        return _this.user.trigger('changeWidget', message.d.d);
      }
    }
  };

};


module.exports = Muzzley;