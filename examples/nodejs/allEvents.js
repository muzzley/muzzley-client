var Muzzley = require('muzzley-client');

// This app demonstrates Muzzley's parametrization possibilities
// and all events that can be emitted.
// The same events are emitted whether you're connecting as an application
// or a user/participant.
// NOTE: This particular example is for an app connection. See the `user.js`
// example to see how to connect as a user. The difference is that you would call
// `muz.connectUser()` with different options and the `.on('connect')` event emits
// a `user` object instead of an `activity` object.

var muz = new Muzzley({
  connectTimeout: 15000,
  reconnect: true,
  reconnectionDelay: 500,
  reconnectionLimit: 10000,
  reconnectionAttempts: 100
});

var connectAppOptions = {
  token: process.env.APP_TOKEN || 'your-app-token', // Get yours at http://muzzley.com
};
muz.connectApp(connectAppOptions);

muz.on('connect', function (activity) {

  console.log('[Connect] Activity created. Yay!');
  console.log('[Connect] You can connect to this activity with Activity Id: ' + activity.activityId);
  console.log('[Connect] If you need a QR code to scan you can open: ' + activity.qrCodeUrl);

  activity.on('participantQuit', function (participant) {
    console.log('Participant "'+participant.name+'" quit!');
  });

  activity.on('participantJoin', function (participant) {

    console.log('Participant "'+participant.name+'" joined!');

    // A participant joined. Tell her to transform into a gamepad.
    participant.changeWidget('gamepad', function (err) {
      if (err) return console.log('changeWidget error: ' + err);
    });

    participant.on('action', function (action) {
      // The action object represents the participant's interaction.
      // In this case it might be "button 'a' was pressed".
      console.log('Gamepad action received: ', action);
    });

    participant.on('quit', function () {
      // You can also check for participant quit events
      // directly in each participant object.
    });

  });
});

muz.on('debug', function (info) {
  // Here you get useful debugging info.
  // All `info` objects have a `type` and a `message` properties.
  // We're not logging this now so the output doesn't become too verbose.
  console.log('[DEBUG] ['+info.type+']: ' + info.message);
});
muz.on('connectError', function (err) {
  console.log('[connectError] Error connecting:', err);
});
muz.on('connectTimeout', function (timeout) {
  console.log('[connectTimeout] Connection timeout (ms):', timeout);
});
muz.on('reconnectAttempt', function (attempt) {
  console.log('[reconnectAttempt] Attempting to reconnect:', attempt);
});
muz.on('reconnect', function (attempt) {
  console.log('[reconnect] Successfully reconnected after attempt:', attempt);
});
muz.on('reconnectError', function (err) {
  console.log('[reconnectError] Error reconnecting:', err);
});
muz.on('reconnectFailed', function () {
  console.log('[reconnectFailed] Could not reconnect after max defined attempts');
});
muz.on('error', function (err) {
  console.log('[error] Generic error:', err);
});
muz.on('disconnect', function (obj) {
  console.log('[disconnect] Disconnected!');
});