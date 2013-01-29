var sockjs = require('sockjs-client');
var RpcManager = require('./RpcManager');
var rpcManager;

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var actualActivity = Object.create(null);
var participants = [];

var Activity = function(activity) {

  var self = this;
  self.rpcManager = rpcManager;

  self.activityId = activity.activityId;
  self.qrCodeUrl = activity.qrCodeUrl;
  

};

util.inherits(Activity, EventEmitter);

var Participant = function(userId, name, photoUrl){
  var self = this;
  self.userId= userId;
  self.name= name;
  self.photoUrl= photoUrl;
  self.rpcManager= rpcManager,
  self.changeWidget = function(callback) {
    self.rpcManager.remoteCalls.changeWidget(self.userId, callback);
   };
};

util.inherits(Participant, EventEmitter);

// Constructor function
var socket = function (token, callback) {
  //TODO Something with options
  var self = this;
  //self.sock = sockjs('http://localhost:9292/ws');
  self.sock = sockjs('http://sandbox-lx01.lab.muzzley.com:9292/ws');

  this.sock.onopen = function() {
    rpcManager = new RpcManager({sock:self.sock});
    var remoteCalls = rpcManager.remoteCalls;

    remoteCalls.handshake(function(err, response){
      console.log("handshake");

      remoteCalls.auth(token, function(err, response){
        console.log("auth");

        remoteCalls.createActivity(function(err, response){
          console.log("createActivity");
          //console.log(response.d);

          var activity = {
            activityId: response.d.activityId,
            qrCodeUrl: response.d.qrCodeUrl
          };

          actualActivity = new Activity(activity);
          callback(actualActivity);

        });

      });

    });
  };

  this.sock.onmessage = function(e) {
    //console.log("Message/Response received:");
    var message = e.data;
    //console.log(message);

    if (typeof message !== 'object') {
      try {
        message = JSON.parse(message);
      } catch (e) {
        //console.log('Received an invalid non-JSON message. Ignoring.');
        //console.log(e);
        return;
      }
    }
    var MESSAGE_TYPE_REQUEST = 1;
    var MESSAGE_TYPE_RESPONSE = 2;
    var MESSAGE_TYPE_REQUEST_CORE = 3;
    var MESSAGE_TYPE_RESPONSE_CORE = 4;
    var MESSAGE_TYPE_SIGNAL = 5;

 
    if (message.h.t  === MESSAGE_TYPE_SIGNAL){
      participants.forEach(function(participant){
        if (participant.userId === message.h.pid){
          participant.emit('action', message.d);
        }
      });
    }

    if (message.h.t  === MESSAGE_TYPE_RESPONSE){
      return rpcManager.handleResponse(message);
    }

    if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){
      if (message.a ==='participantJoined'){
        var participant  = new Participant(
                                    message.d.participant.id,
                                    message.d.participant.name,
                                    message.d.participant.photoUrl
                                  );

        participants.push(participant);
        return rpcManager.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE_CORE, message.h.cid, participant.userId);
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

  this.sock.onclose   = function()  {
    console.log("close");
  };

};

module.exports = socket;
