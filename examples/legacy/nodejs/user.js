var Muzzley = require('muzzley-client');

// This script demonstrates how you can connect to Muzzley as a user and become
// an activity's participant. This is what the Muzzley smartphone applications do.
// So, here's your chance to simulate being a smartphone participant.

var userOptions = {
  token: process.env.USER_TOKEN || 'guest', // Only 'guest' is currently supported
  activityId: process.env.ACTIVITY_ID || 'some-activity-id'
};

var muz = new Muzzley();
var connectUserStart = new Date().getTime();
muz.connectUser(userOptions);

var globalUser = null;

muz.on('connect', function (user) {
  console.log('[Connect] User: ', user);
  console.log('Time taken: ' + (new Date().getTime() - connectUserStart) + 'ms');

  user.on('changeWidget', function (widget) {
    console.log('changeWidget received for widget ' + widget.widget);

    if (widget.widget === 'gamepad') {
      // Simulate pressing the Gamepad's 'A' button
      user.sendWidgetData({
        w: 'gamepad',
        e: 'press',
        c: 'ba',
        v: 'a'
      });
    }
  });

  globalUser = user;
});

muz.on('error', function (err) {
  console.log('[error] Generic error: ', err);
});

muz.on('disconnect', function (obj) {
  console.log('[disconnect] Disconnected!');
});

muz.on('reconnect', function (attempt) {
  console.log('Reconnected. User properties:', globalUser);
});

muz.on('debug', function (info) {
  console.log('[DEBUG] {'+info.type+'} ' + info.message);
});
