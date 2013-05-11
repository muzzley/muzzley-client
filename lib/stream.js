var Eventify = require('eventify');
var shoe = require('shoe');
var es = require('event-stream');
var JSONStream = require('JSONStream')
function Muzzley (options) {

}


Muzzley.prototype.createActivity = function(opts, callback){
  var _this = this;

  _this.stream = shoe('http://platform.geo.muzzley.com/web', function(){
    
    var handshake = {
      h: {
        cid: 1,
        t: 1
      },
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

    _this.stream.write(JSON.stringify(handshake));

    var loginApp = es.through(function write(data) {
      if (data.s === true && data.m === 'Handshake validated') {
        var login = {
          h: {
            cid: 1,
            t: 1
          },
          a: 'loginApp',
          d: {
            token: 'muzzlionaire'
          }
        };
        this.emit('data', login);
      }else {
        this.emit('data', data);
      }
      
      
    });

    var createActivity = es.through(function write(data) {      
      if (data.s === true && data.d.sessionId) {
        var activity = {
          h: {
            cid: 1,
            t: 1
          },
          a: 'create',
          d: {
            protocolVersion: '1.0',
            lib: 'js',
            libVersion: '0.1',
            activityId: null
          }
        };
        this.emit('data', activity);
      }else {
        this.emit('data', data);
      }
      
      
    });

    var activityCreated = es.through(function write(data) {      
      if (data.s === true && data.d.activityId && data.d.qrCodeUrl) {
        var activity = {
          activityId: data.d.activityId,
          qrCodeUrl: data.d.qrCodeUrl
        };

        // Enable Events on activity
        Eventify.enable(activity);

        // Add the activity object to the current context _this
        _this.activity = activity;

        callback(null, activity);
      }else {
        this.emit('data', data);
      }
      
      
    });


    var handleActions = es.through(function write(data) {      
      if (data.a === 'signal') {
        console.log(data.d);
      }else {
        this.emit('data', data);
      }
    });


    _this.stream
      .pipe(JSONStream.parse())
      .pipe(loginApp)
      .pipe(createActivity)
      .pipe(activityCreated)
      .pipe(handleActions)
      .pipe(JSONStream.stringify(false))
      .pipe(_this.stream);

  });
  
  
  
};




module.exports = Muzzley;