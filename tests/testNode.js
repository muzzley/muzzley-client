var muzzley = require('../lib/node-dist.js');


console.log('##Activity: creating activity');
muzzley.createActivity('muzzlionaire', function(err, activity){

  console.log('##Activity: activityCreated');

  activity.on('participantQuit', function(participant){
    console.log('##Activity: "EVENT" participantQuit');
  });

  activity.on('participantJoin', function(participant){

    console.log('##Activity: "EVENT" participantJoined');
    console.log('##Activity: sending changeWidget');

    participant.changeWidget('gamepad', function (err) {
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