var argv = require('optimist').argv;
var muzzley = require('../lib/node-dist.js');

//Catch the app token passed 
var appToken = argv.t ? argv.t : 'muzzlionaire';

console.log(appToken);
console.log('##Activity: creating activity');

//Catch error events
muzzley.on('error', function(err){
  console.log(err.toString());
});

muzzley.connectApp(appToken, function(err, activity){

  if (err) return console.log("err: " + err );

  console.log('##Activity: activityCreated');
  console.log('##Activity Settings:');
  console.log(activity);
 
  activity.on('participantQuit', function(participant){
    console.log('##Activity: "EVENT" participantQuit');
  });

  activity.on('participantJoin', function(participant){

    console.log('##Activity: participantJoined');
    console.log('##Activity: sending changeWidget');

    participant.changeWidget('gamepad', function (err) {
      if (err) return console.log("err: " + err );
      console.log('##Activity: recived changeWidget okay');

      participant.on('quit', function (action) {
        // Action object represents the participants interaction
        console.log('quit');
        //console.log(action);
      });


      participant.on('action', function (action) {
        // Action object represents the participants interaction
        console.log(action);
      });
    });
  });
});