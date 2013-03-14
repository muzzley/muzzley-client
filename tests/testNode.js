var muzzley = require('../lib/node-dist.js');


console.log('##Activity: creating activity');
muzzley.createActivity('muzzliodnaire', function(err, activity){
  if (err) return console.log("err: " + err );

  muzzley.joinActivity('muzdev', activity.activityId, function(err, paticipant){

    //console.log(paticipant);
    console.log('##User joinedActivity');
    paticipant.on('changeWidget', function(widget){
      console.log('##User changeWidget recived');
    });

  });

  console.log('##Activity: activityCreated');
  console.log(activity);
  activity.on('participantQuit', function(participant){
    console.log('##Activity: "EVENT" participantQuit');
  });

  activity.on('participantJoin', function(participant){

    console.log('##Activity: participantJoined');
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