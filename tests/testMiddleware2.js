var muzzley = require('../lib/muzzMiddleware');

var sockJs = require('sockjs-client');
var utils = require('../utils');

var options = {
  socket: sockJs,
  endPoint:'http://platform.geo.muzzley.com/web'
};


var muzzleyApp = new muzzley(options);


muzzleyApp.connectApp('muzzlionaire');
muzzleyApp.on('buttonA', function(player){
  console.log(player);
});


muzzleyApp.on('connected', function(activity){
  console.log('event');
  console.log(activity);

  var qrCodeImg = document.getElementById('qrCodeImg');
  qrCodeImg.src = activity.qrCodeUrl;

  var muzzleyParticipant = new muzzley(options);
  muzzleyParticipant.joinActivity('muzdev', activity.activityId);

  muzzleyParticipant.on('joined', function(err, participant){
    console.log('event');
    console.log(participant);
  });
  muzzleyParticipant.on('changeWidget', function(widget){
    console.log('widget');
    console.log(widget);
    var _this = this;

    setInterval(function(){
      _this.remoteCalls.sendWidgetData({
        "w": "gamepad",
        "c": "b",
        "v": 1,
        "e": 2
      });
    }, 200);

    setTimeout(function(){
      _this.remoteCalls.quit();
    }, 5000);

  });
});

muzzleyApp.on('participantJoin', function(participant){
  console.log('participantJoin');

  participant.changeWidget('gamepad', function (err) {
    console.log(err);
  });

  participant.on('action', function(action){
    console.log('action');
    //console.log(action);
  });

  participant.on('quit', function(){
    console.log('quit');
  });
});