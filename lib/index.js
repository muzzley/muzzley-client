var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var messageHandler = require('./messageHandler.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.endPoint = options.endPoint;
  _this.socket = options.socket;
  _this.logMessages = options.logMessages || true;
  _this.logSocketData = options.logSocketData || false;
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

    if(_this.logMessages) console.log('##Activity: sending handShake');
    _this.remoteCalls.handShake(function(err, response){
      if(_this.logMessages) console.log('##Activity: handshaked');

      if(_this.logMessages) console.log('##Activity: sending authApp');
      _this.remoteCalls.authApp(options.token, function(err, response){
        if(_this.logMessages) console.log('##Activity: Authenticaded');

        if(_this.logMessages) console.log('##Activity: sending createActivity');
        _this.remoteCalls.createActivity(options.activityId, function(err, response){
          if(_this.logMessages) console.log('##Activity: Activity Created');

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
    if(_this.logSocketData) console.log('##Activity MessageRecived:');
    if(_this.logSocketData) console.log(message);
    messageHandler.apply(_this, [message]);
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

    if(_this.logMessages) console.log('##User: sending handShake');

    _this.remoteCalls.handShake(function(err, response){
      if(_this.logMessages) console.log('##User: handShaked');
      if(_this.logMessages) console.log('##User: sending authUser');
      _this.remoteCalls.authUser(userToken, function(err, response){
        if(_this.logMessages) console.log('##User: user Authenticaded');

        if(_this.logMessages) console.log('##User: sending joinActivity');
        _this.remoteCalls.joinActivity(activityId, function(err, response){
          if(_this.logMessages) console.log('##User: joined Activity');

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
          if(_this.logMessages) console.log('##User: sending Ready Notification');
          return _this.remoteCalls.sendReady(function(){
            if(_this.logMessages) console.log('##User: Recived Ready Notification');
            callback(null, _this.user);
          });
        });
      });
    });
  };

  _this.socket.onmessage = function(message) {
    if(_this.logSocketData) console.log('##User MessageRecived:');
    if(_this.logSocketData) console.log(message);
    messageHandler.apply(_this, [message]);
  };

};


module.exports = Muzzley;