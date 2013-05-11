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
function remoteCalls(socket){
  this.socket = socket;
}


remoteCalls.prototype.successResponse = function(originalHeader){
  console.log('successResponse');
  //Protocol message codes
  var MESSAGE_TYPE_REQUEST = 1;
  var MESSAGE_TYPE_RESPONSE = 2;
  var MESSAGE_TYPE_REQUEST_CORE = 3;
  var MESSAGE_TYPE_RESPONSE_CORE = 4;
  var MESSAGE_TYPE_SIGNAL = 5;

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


var Eventify    = require('eventify');
var hb          = require('./middleware/heartBeat');
var rpcManager  = require('./middleware/rpcManager');
var playerJoin  = require('./middleware/playerJoin');
var playerAction  = require('./middleware/playerAction');
var playerQuit  = require('./middleware/playerQuit');
var btnA  = require('./middleware/btnA');

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

muzzMiddleware.prototype.connectApp = function(opts, callback){
  //remember this
  var _this = this;

  this.socket = new this.socket(this.endPoint);
  this.socket.onopen = function()  {

    //create rpcManager for this socket
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket);

    //Configure default middlewares
    _this.middleFunctions.push(hb);
    _this.middleFunctions.push(_this.rpcManager.handleResponse);
    _this.middleFunctions.push(playerJoin);
    _this.middleFunctions.push(playerAction);
    _this.middleFunctions.push(playerQuit);
    _this.middleFunctions.push(btnA);




    _this.runMiddlewares = compose.apply(this, _this.middleFunctions);

    var handshake = {
      a: 'handshake',
      d: {
        // Mandatory
        protocolVersion: '1.0',
        // All the following are optional and experimental
        lib: 'nodejs',
        userAgent: 'muzzley-sdk-js',
        connection: 'LAN',
        contentType: 'application/json'
      }
    };

    _this.rpcManager.makeRequest(handshake, function(err, muzzData){
      //console.log(muzzData);
      var loginApp = {
        a: 'loginApp',
        d: {
          token: 'muzzlionaire'
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
          return callback(null, activity);
        });

      });

    });

  };


  _this.socket.onmessage = function(message) {
    _this.runMiddlewares(message, function (muzzData) {
      console.log(muzzData);
    });
  };
};

module.exports = muzzMiddleware;