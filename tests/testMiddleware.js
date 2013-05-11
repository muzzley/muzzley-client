var muzzley = require('../lib/muzzMiddleware');

var sockJs = require('sockjs-client');
var utils = require('../utils');

var options = {
  socket: sockJs,
  endPoint:'http://platform.geo.muzzley.com/web'
};


var muzzleyConnection = new muzzley(options);

muzzleyConnection.on('connected', function(activity){
  console.log('event');
  console.log(activity);

  activity.on('participantJoin', function(participant){
    console.log('participantJoin');

    participant.on('action', function(action){
      //console.log('action');
      //console.log(action);
    });

    participant.on('quit', function(){
      console.log('quit');
    });
  });

});



muzzleyConnection.on('buttonA', function(player){
  console.log(player);
});


muzzleyConnection.on('participantJoin', function(participant){
  console.log('participant joined');
});

muzzleyConnection.connectApp('muzzlionaire', function(err, activity){

  var qrCodeImg = document.getElementById('qrCodeImg');

  qrCodeImg.src = activity.qrCodeUrl ;

  activity.on('participantJoin', function(participant){
    participant.changeWidget('gamepad', function (err) {
      console.log(err);
    });
  });

  activity.on('participantQuit', function(participant){
    console.log('participantQuit');
    console.log(participant);
  });

});

