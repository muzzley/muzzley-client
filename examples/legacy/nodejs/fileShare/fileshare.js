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

    participant.changeWidget('assetsPicker', function (err) {
      if (err) return console.log("err: " + err );
      console.log('##Activity: recived changeWidget okay');
      console.log(arguments);

      participant.on('quit', function () {
        console.log('quit');
      });

      console.log('Inviting to a file sharing session.');
      var sharingContext = participant.createSharingContext('context1');
      sharingContext.invite(
        {
          filesCount: 1,
          totalSize: 1024
        },
        function (err, result) {
          console.log('Sharing invitation accepted? ' + result.accept + '! Reason? ' + result.reason);
        }
      );

      participant.on('sharingInvitation', function (action, callback) {
        console.log('SHARING INVITATION');
        console.log(arguments);

        callback(true, 'Invitation accepted');
      });

      participant.on('sharingFile', function (file) {
        console.log('SHARING FILE notification');
        console.log(file);

        request(file.url)
          .pipe(fs.createWriteStream('./shares/' + file.fileName));
      });

      participant.on('sharingEnd', function (data) {
        console.log('SHARING END');
        console.log(data);
      });

      participant.on('sharingCancel', function (data) {
        console.log('SHARING CANCEL');
        console.log(data);
      });

    });
  });
});
