function compose () {
  var funx = [].slice.call(arguments)
  if(funx.length <= 1)
    return funx[0]
  var f1 = funx.shift()
  var f2 = funx.shift()
  
  funx.unshift(function () {
    var args = [].slice.call(arguments)
    var callback = args.pop()
    args.push(function () {
      var args = [].slice.call(arguments)
      args.push(callback)    
      f2.apply(_this, args)   
    })
    var _this = this;
    f1.apply(_this, args)   
  })
  return compose.apply(null, funx)
}



//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}


remoteCalls.prototype.successResponse = function(originalHeader){
  //Protocol message codes
  var MESSAGE_TYPE_REQUEST = 1;
  var MESSAGE_TYPE_RESPONSE = 2;
  var MESSAGE_TYPE_REQUEST_CORE = 3;
  var MESSAGE_TYPE_RESPONSE_CORE = 4;

  var msg = {
    h: originalHeader,
    s: true
  };

  if (originalHeader.t === MESSAGE_TYPE_REQUEST) {
    msg.h.t = MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = MESSAGE_TYPE_RESPONSE_CORE;
  }

  this.socket.send(JSON.stringify(msg));

};

remoteCalls.prototype.sendWidgetData= function (data){
  var msg = {
    h: {
      t: 5
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.quit = function (data){
  var quit = {
    a: 'quit'
  };

  this.rpcManager.makeRequest(quit, function(err, muzzData){
    console.log(muzzData);
  });
};

var Eventify    = require('eventify');
var hb          = require('./middleware/heartBeat');
var rpcManager  = require('./middleware/rpcManager');
var playerJoin  = require('./middleware/playerJoin');
var playerAction  = require('./middleware/playerAction');
var playerQuit  = require('./middleware/playerQuit');
var btnA  = require('./middleware/btnA');
var transformControl  = require('./middleware/transformControl');


var handshakeJSON = {
  a: 'handshake',
  d: {
    // Mandatory
    protocolVersion: '1.0',
    // All the following are optional and experimental
    lib: 'nodejs',
    userAgent: 'muzzley-client',
    connection: 'LAN',
    contentType: 'application/json'
  }
};


//
// Middleware MAIN
//

function muzzMiddleware(options){

  this.socket = options.socket;
  this.endPoint = options.endPoint;

  this.middleFunctions = [];
  this.participants = {};


  //Enable events for this muzzley instance
  Eventify.enable(this);

}
muzzMiddleware.prototype.joinActivity = function(userToken, activityId, callback){
  //remember this
  var _this = this;

  this._socket = new this.socket(this.endPoint);
  this._socket.onopen = function()  {
    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new remoteCalls(_this._socket, _this.rpcManager);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(transformControl);
    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);



    _this.rpcManager.makeRequest(handshakeJSON, function(err, muzzData){

      var authUser = {
        a: 'loginUser',
        d: {
          token: userToken //TODO: Token passed in opts
        }
      };
      _this.rpcManager.makeRequest(authUser, function(err, muzzData){

        var joinActivity = {
          a: 'join',
          d: {
            activityId: activityId
          }
        };

        _this.rpcManager.makeRequest(joinActivity, function(err, muzzData){
          //Create the participant object
          var participant = {
            id: muzzData.d.participant.id,
            name: muzzData.d.participant.name,
            photoUrl: muzzData.d.participant.photoUrl
          };

          var activity = {
            id: activityId
          };

          // Enable Events on the participant
          Eventify.enable(participant);

          // Add the activity object to the current context _this
          _this.participant = participant;

          var sendReady = {
            'a': 'signal',
            'd': {
              'a': 'ready'
            }
          };

          _this.rpcManager.makeRequest(sendReady, function(err, muzzData){

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


muzzMiddleware.prototype.connectApp = function(opts, callback){
  //remember this
  var _this = this;

  _this._socket = new this.socket(this.endPoint);
  _this._socket.onopen = function()  {

    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this._socket);
    _this.remoteCalls = new remoteCalls(_this._socket);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(playerJoin);
    _this.middleFunctions.push(playerAction);
    _this.middleFunctions.push(playerQuit);
    _this.middleFunctions.push(btnA);




    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);


    _this.rpcManager.makeRequest(handshakeJSON, function(err, muzzData){
      //console.log(muzzData);
      if (err){
        _this.endPoint = 'http://platform.geo.muzzley.com/web';
        return _this.connectApp(opts, callback);
      }

      var loginApp = {
        a: 'loginApp',
        d: {
          token: 'muzzlionaire' //TODO: Token passed in opts
        }
      };

      _this.rpcManager.makeRequest(loginApp, function(err, muzzData){
        //console.log(muzzData);
        var createActivity = {
          a: 'create'
        };

        _this.rpcManager.makeRequest(createActivity, function(err, muzzData){
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


  _this._socket.onmessage = function(message) {
    _this.runMiddlewares(message, function (muzzData) {
      console.log(muzzData);
    });
  };
};

module.exports = muzzMiddleware;