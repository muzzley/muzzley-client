var muzzley = require('../lib/index');
var errors = require('../lib/utils/error-browser.js');
var sockJs = require('sockjs-client');

var optionsActivity = {
  socket: sockJs,
  //endPoint:'http://platform.geo.muzzley.com/web'
  endPoint:'http://localhost:8082/web'

};

var optionsParticipant = {
  socket: sockJs,
  //endPoint:'http://platform.geo.muzzley.com/web'
  endPoint:'http://localhost:8082/web'

};


var muzzleyApp = new muzzley(optionsActivity);

muzzleyApp.on('error', function(err){
  errors.sendError(err);
  console.log(err);
});

muzzleyApp.connectApp('muzzlionaire');
muzzleyApp.on('buttonA', function(player){
  console.log(player);
});


muzzleyApp.on('connected', function(activity){
  console.log('event');
  console.log(activity);

  var qrCodeImg = document.getElementById('qrCodeImg');
  qrCodeImg.src = activity.qrCodeUrl;

  var muzzleyParticipant = new muzzley(optionsParticipant);

  muzzleyParticipant.joinActivity('muzdev', activity.activityId, function(err, user){
    console.log('event');
    console.log(user);
    user.on('changeWidget', function(widget){
      console.log('widget');
      console.log(widget);
      var _this = this;

      setInterval(function(){
        user.sendWidgetData({
          "w": "gamepad",
          "c": "b",
          "v": 1,
          "e": 2
        });
      }, 200);

      setTimeout(function(){
        //_this.remoteCalls.quit();
      }, 5000);

    });
  });
});

 // muzzleyParticipant.on('joined', 

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