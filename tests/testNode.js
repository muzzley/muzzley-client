var muzzley = require('../lib/node-dist.js');


muzzley.createActivity('asd', function(err, activity){

  console.log(activity);
  console.log('activityCreated');

  activity.on('participantQuit', function(participant){
    console.log('participantQuit');
  });
  activity.on('participantJoin', function(participant){
    console.log(participant);
    participant.changeWidget('gamepad', function (err) {
      console.log('changeWidget');

      participant.on('quit', function (action) {
        // Action object represents the participants interaction
        console.log('asd');
        console.log(action);
      });


      participant.on('action', function (action) {
        // Action object represents the participants interaction
        console.log(action);
      });
    });
  });
});
