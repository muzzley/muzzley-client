var Muzzley = require('muzzley-client');

var muz = new Muzzley({
  //idleTimeout: 10000,
  connection: {
    host: 'localhost',
    port: 9292
  }
});

// Connect App with `init` test
var initUserStart = new Date().getTime();
var channelInit = muz.initUser({
  deviceId: '000-111-222-DEVICE-ID',
  token: 'guest',
  join: {
    activityId: process.env.ACTIVITY_ID || 'some-activity-id'
  }
});
channelInit.on('joined', function (activity) {
  console.log('Init App Complete! Response:', activity);
  console.log('Time taken: ' + (new Date().getTime() - initUserStart) + 'ms');
});