var muzzley = require('../../../lib/dist-node.js');
var request = require('request');
var fs = require('fs');

var appToken = 'your-app-token';

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

    participant.changeWidget('cameraStream', function (err) {
      if (err) return console.log("err: " + err );
      console.log('##Activity: recived changeWidget okay');

      participant.on('quit', function (action) {
        // Action object represents the participants interaction
        console.log('quit');
        //console.log(action);
      });


      participant.on('sendMediaStream', function (action) {
        // Action object represents the participants interaction
        console.log(action);
      });

    });
  });
});