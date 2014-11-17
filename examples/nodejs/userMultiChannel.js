var Muzzley = require('muzzley-client');

// This script demonstrates how you can connect to Muzzley as a user and become
// an activity's participant. This is what the Muzzley smartphone applications do.
// So, here's your chance to simulate being a smartphone participant.

var userOptions = {
  token: process.env.USER_TOKEN || 'guest', // Only 'guest' is currently supported
  activityId: process.env.ACTIVITY_ID || 'some-activity-id'
};

var muz = new Muzzley({
  //idleTimeout: 10000,
  connection: {
    //host: 'localhost',
    host: 'platform.office.muzzley.com'
    //port: 9292
  }
});

var channelUser1 = muz.connectUser(userOptions);
channelUser1.on('joined', function (user) {
  console.log('USER CHANNEL ON CONNECT!', user);
});

setTimeout(function () {

  var joinOptions2 = {
    activityId: process.env.ACTIVITY_ID || 'some-activity-id'
  };
  var channel2 = muz.join(joinOptions2);
  channel2.on('joined', function (user) {
    console.log('Joined Second Channel to first activity. User object:', user);

    user.on('changeWidget', function (data) {
      console.log('CHANGE WIDGET EVENT TRIGGERED!', data);
    });

    user.on('activityTerminated', function () {
      console.log('ACTIVITY TERMINATED EVENT TRIGGERED!');
    });

  });

  var joinOptions3 = {
    activityId: process.env.ACTIVITY_ID2 || 'some-activity-id'
  };
  var channel3 = muz.join(joinOptions3);
  channel3.on('joined', function (user) {
    console.log('Joined Third Channel to second activity. User Object: ', user);
  });

  // channel3.quit();

}, 2000);




var globalUser = null;

muz.on('connect', function (user) {
  console.log('[Connect] User: ', user);

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
  // console.log('[DEBUG] {'+info.type+'} ' + info.message);
});
