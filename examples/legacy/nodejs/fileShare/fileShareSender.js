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

    participant.on('quit', function () {
      console.log('quit');
    });

    function sendFile(ctx) {
      ctx.shareFile({fileName: '1.jpg', contentType: 'image/jpeg'}, function (err, result) {
        console.log('RESULT:');
        console.log(arguments);
        console.log('ShareFile token: ' + result.token + ', url: ' + result.url);
      });

      setTimeout(function () {
        ctx.end(function (err) {
          if (err) {
            return console.log('Error ending context ' + ctx.context + '. Err: ' + err);
          }
          console.log('Context ' + ctx.context + ' ended.');
        });
      }, 2000);
    }

    console.log('Inviting to a file sharing session.');
    var sharingContext = participant.createSharingContext('context1');
    sharingContext.invite(
      {
        filesCount: 1,
        totalSize: 1024
      },
      function (err, result) {
        console.log('Sharing invitation accepted? ' + result.accept + '! Reason? ' + result.reason);
        if (result.accept) {
          sendFile(sharingContext);
        }
      }
    );

    participant.on('sharingCancel', function (data) {
      console.log('Sharing context "'+data.context+'" canceled.');
    });

  });
});
