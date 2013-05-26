var Eventify                = require('eventify');
var compose                 = require('./utils/compose');

//RPCmanager
var rpcManager              = require('./utils/rpcManager');

//midlewares
var hb                      = require('./middleware/heartBeat');
var playerJoin              = require('./middleware/activity/playerJoin');
var playerAction            = require('./middleware/activity/playerAction');
var playerQuit              = require('./middleware/activity/playerQuit');
var btnA                    = require('./middleware/activity/btnA');
var transformControl        = require('./middleware/participant/transformControl');

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
muzzMiddleware.prototype.joinActivity = function(userToken, activityId, callback){
  //remember this
  var _this = this;

  this._socket = new this.socket(this.endPoint);
  this._socket.onopen = function()  {
    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new participantRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(transformControl);
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);



   _this.remoteCalls.handshake(function(err, muzzData){
      //If error return the error.
      if(err) return callback(err);

      _this.remoteCalls.authUser(userToken, function(err, muzzData){
        if(err) return callback(err);

        _this.remoteCalls.joinActivity(activityId, function(err, muzzData){
          if (err) {
            //IF the error as a connectTo then reconnect
            if (err.d.connectTo){

              if(process.browser){
                _this.endPoint = 'http://' + err.d.connectTo + '/web';
              }else{
                _this.endPoint = 'ws://' + err.d.connectTo + '/ws';
              }

              return _this.joinActivity(userToken, activityId, callback);

            }else{
              return callback(err);
            }
          }

          //Create the participant object
          var participant = {
            id: muzzData.d.participant.id,
            name: muzzData.d.participant.name,
            photoUrl: muzzData.d.participant.photoUrl,
            sendWidgetData: function(data) {
              _this.remoteCalls.sendWidgetData(data);
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
      console.log(muzzData);
    });
  };

  };
};


/*
*   Main function that connects you to muzzley as a app
*
*/
muzzMiddleware.prototype.connectApp = function(opts, callback){
  //If no callback passed define an empety one
  if (typeof(callback) !== 'function') var callback = function(){};

  //remember this
  var _this = this;

  _this._socket = new this.socket(this.endPoint);

  //On socket connection stablished
  _this._socket.onopen = function()  {

    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new activityRemoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(playerJoin);
    _this.middleFunctions.push(playerAction);
    _this.middleFunctions.push(playerQuit);
    _this.middleFunctions.push(btnA);



    //Compose the midleware functions
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);


    _this.remoteCalls.handshake(function(err, muzzData){
      //If error return the error.
      if(err) return callback(err);

      _this.remoteCalls.loginApp(function(err, muzzData){
        //If error return the error.
        if(err) return callback(err);

        _this.remoteCalls.createActivity(function(err, muzzData){
          //If error return the error.
          if (err) {
            //IF the error as a connectTo then reconnect
            if (err.d.connectTo){

              if(process.browser){
                _this.endPoint = 'http://' + err.d.connectTo + '/web';
              }else{
                _this.endPoint = 'ws://' + err.d.connectTo + '/ws';
              }
              return _this.connectApp(opts, callback);
            }else{
              return callback(err);
            }
          }

          //Create the activity object
          var activity = {
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
      console.log(muzzData);
    });
  };
};

module.exports = muzzMiddleware;