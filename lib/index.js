//Lib details
var version = '0.3.0';
var protocol = '1.1.0';

var Eventify                = require('eventify');
var compose                 = require('./utils/compose');

//RPCmanager
var rpcManager              = require('./rpcManager/rpcManager');

//midlewares
var hb                      = require('./middleware/heartBeat');
var playerJoin              = require('./middleware/activity/playerJoin');
var playerAction            = require('./middleware/activity/playerAction');
var playerQuit              = require('./middleware/activity/playerQuit');
var btnA                    = require('./middleware/activity/btnA');
var transformControl        = require('./middleware/participant/transformControl');
var setupComponent          = require('./middleware/participant/setupComponent');

var fileShareInvite         = require('./middleware/fileShare').fileShareInvite;
var receiveFile             = require('./middleware/fileShare').receiveFile;
var sharingEnd              = require('./middleware/fileShare').sharingEnd;

var mediaStream             = require('./middleware/mediaStream');
var signalingMessage        = require('./middleware/signalingMessage');

//remoteCalls
var activityRemoteCalls     = require('./remoteCalls/activity');
var participantRemoteCalls  = require('./remoteCalls/participant');


//
// MAIN
//

function muzzMiddleware(options){

  this.socket = options.socket;
  this.endPoint = options.endPoint;

  this.middleFunctions = [];
  this.participants = {};


  //Enable events for this muzzley instance
  Eventify.enable(this);

}

/*
*   Main function that connects you to muzzley as a Participant
*
*/
muzzMiddleware.prototype.connectUser = function(userToken, activityId, callback){
  //remember this
  var _this = this;

  this._socket = new this.socket(this.endPoint);
  this._socket.onopen = function()  {
    //Create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new participantRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(transformControl);
    _this.middleFunctions.push(setupComponent);
    _this.middleFunctions.push(signalingMessage);
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);



   _this.remoteCalls.handshake(function(err, muzzData){
      //If error return the error.
      if (err) {
        _this.trigger('error', err);
        return callback(err);
      }

      _this.remoteCalls.authUser(userToken, function(err, muzzData){
        if (err) {
          _this.trigger('error', err);
          return callback(err);
        }

        _this.remoteCalls.joinActivity(activityId, function(err, muzzData){
          if (err) {
            _this.trigger('error', err);
            return callback(err);
          }

          if (muzzData.d && muzzData.d.connectTo) {
            //We're being redirected
            if(process.browser){
              _this.endPoint = 'http://' + muzzData.d.connectTo + '/web';
            }else{
              _this.endPoint = 'ws://' + muzzData.d.connectTo + '/ws';
            }
            return _this.connectUser(userToken, activityId, callback);
          }

          //Create the participant object
          var participant = {
            id: muzzData.d.participant.id,
            name: muzzData.d.participant.name,
            photoUrl: muzzData.d.participant.photoUrl,
            sendWidgetData: function(data) {
              _this.remoteCalls.sendWidgetData(data);
            },
            sendSignal: function (type, data, callback) {
              _this.remoteCalls.sendSignal(type, data, callback);
            }
          };

          var activity = {
            id: activityId
          };

          // Enable Events on the participant
          Eventify.enable(participant);

          // Add the activity object to the current context _this
          _this.participant = participant;


          //Send Ready event to activity
          _this.remoteCalls.sendReady(function(err, muzzData){
            _this.trigger("joined", null, _this.participant);
            if (callback){
              return callback(null, _this.participant);
            }
            else return ;
          });


        });

      });
    });

  _this._socket.onmessage = function(message) {
    _this.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };

  };
};


/*
*   Main function that connects you to muzzley as a app
*
*/
muzzMiddleware.prototype.connectApp = function(options, callback){
  //If no callback passed define an empety one
  if (typeof(callback) !== 'function') callback = function(){};

  //remember this
  var _this = this;

  _this._socket = new this.socket(this.endPoint);

  // connection timeout ms
  var TIMEOUT = 5000;

  // Connection Timeout
  var connectionTimeout = setTimeout(function () {
    _this.trigger('error', {error:'Timeout'});
  }, TIMEOUT);


  _this._socket.onerror = function(error)  {
    //Clear conncetion timeout
    clearTimeout(connectionTimeout);
    _this.trigger('error', error);
  };
  //On socket connection stablished
  _this._socket.onopen = function()  {

    //Clear conncetion timeout
    clearTimeout(connectionTimeout);

    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new activityRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(playerJoin);
    _this.middleFunctions.push(playerAction);
    _this.middleFunctions.push(playerQuit);
    _this.middleFunctions.push(fileShareInvite);
    _this.middleFunctions.push(receiveFile);
    _this.middleFunctions.push(sharingEnd);
    _this.middleFunctions.push(mediaStream);
    _this.middleFunctions.push(signalingMessage);

    //Compose the midleware functions
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);


    _this.remoteCalls.handshake(function(err, muzzData){
      //If error return the error.
      if (err) {
        _this.trigger('error', err);
        return callback(err);
      }

      _this.remoteCalls.loginApp(options, function(err, muzzData){
        //If error return the error.
        if (err) {
          _this.trigger('error', err);
          return callback(err);
        }

        _this.remoteCalls.createActivity(options, function(err, muzzData){
          //If error return the error.
          if (err) {
            _this.trigger('error', err);
            return callback(err);
          }

          if (muzzData.d && muzzData.d.connectTo) {
            //We're being redirected
            if(process.browser){
              _this.endPoint = 'http://' + muzzData.d.connectTo + '/web';
            }else{
              _this.endPoint = 'ws://' + muzzData.d.connectTo + '/ws';
            }
            return _this.connectApp(options, callback);
          }

          //Create the activity object
          var activity = {
            quit: function (callback) {
              _this.remoteCalls.quit(null, callback);
            },
            activityId: muzzData.d.activityId,
            qrCodeUrl: muzzData.d.qrCodeUrl
          };

          // Enable Events on activity
          Eventify.enable(activity);

          // Add the activity object to the current context _this
          _this.activity = activity;

          _this.trigger("connected", activity);
          if (callback){
            callback(null, activity);
          }
          else return ;

        });

      });

    });

  };

  //Function to handle socket messages
  _this._socket.onmessage = function(message) {
    _this.runMiddlewares(message, function (muzzData) {
      // If a message arrives here it's because it passed
      // through the whole middleware chain.
    });
  };
};

module.exports = muzzMiddleware;