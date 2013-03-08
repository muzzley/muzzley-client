var muzzley = require('../lib/node-dist.js');


muzzley.createActivity('asd', function(err, activity){

  console.log(activity);
  console.log('connectou');

  activity.on('participantJoin', function(participant){
    console.log(participant);
    participant.changeWidget('gamepad', function (err) {
      console.log('changeWidget');
      participant.on('action', function (action) {
        // Action object represents the participants interaction
        console.log(action);
      });
    });
  });
});
