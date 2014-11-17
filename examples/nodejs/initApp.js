var Muzzley = require('muzzley-client');

var muz = new Muzzley({
  //idleTimeout: 10000,
  connection: {
    host: 'localhost',
    port: 9292
  }
});

// Connect App with `init` test
var initAppStart = new Date().getTime();
var channelInit = muz.initApp({
  deviceId: '000-111-222-DEVICE-ID',
  token: 'muzzlionaire',
  create: true
});
channelInit.on('created', function (activity) {
  console.log('Init App Complete! Response:', activity);
  console.log('Time taken: ' + (new Date().getTime() - initAppStart) + 'ms');
});
