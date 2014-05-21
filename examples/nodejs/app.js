var Muzzley = require('muzzley-client');

var connectAppOptions = {
  token: process.env.APP_TOKEN || 'your-app-token' // Get yours at http://muzzley.com
};

var muz = new Muzzley();

muz.connectApp(connectAppOptions);

muz.on('connect', function (activity) {

  console.log('[Connect] Activity created. Yay!');
  console.log('[Connect] You can connect to this activity with Activity Id: ' + activity.activityId);
  console.log('[Connect] If you need a QR code to scan you can open: ' + activity.qrCodeUrl);

  activity.on('participantQuit', function (participant) {
    console.log('Participant "' + participant.name + '" quit!');
  });

  activity.on('participantJoin', function (participant) {

    console.log('Participant "' + participant.name + '" joined!');

    participant.changeWidget('gamepad', function (err) {
      // A participant joined. Tell her to transform into a gamepad.
      if (err) return console.log('changeWidget error: ' + err);
    });

    participant.on('action', function (action) {
      // The action object represents the participant's interaction.
      // In this case it might be "button 'a' was pressed".
      console.log('Widget action received: ', action);
    });

    participant.on('quit', function () {
      // You can also check for participant quit events
      // directly in each participant object.
    });

  });
});
muz.on('error', function (err) {
  console.log('[error] Generic error: ', err);
});
muz.on('disconnect', function (obj) {
  console.log('[disconnect] Disconnected!');
});