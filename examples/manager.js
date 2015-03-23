var Muzzley = require('muzzley-client');

// Get your Profile Id and App Token by
// registering at www.muzzley.com and creating an App.
var APP_TOKEN = process.env.APP_TOKEN || 'your-app-token';
var PROFILE_ID = process.env.PROFILE_ID || 'your-profile-id';

var muzzley = new Muzzley();
var connectionChannel = muzzley.initApp({ token: APP_TOKEN });

connectionChannel.on('error', function (err) {
  console.log('[error] Error:', err);
});

muzzley.on('connect', function () {
  console.log('Manager connected!');
  console.log('Subscribing to the events of all devices of a certain type...');

  var subscriptionChannel = muzzley.subscribe({
    namespace: 'iot',
    payload: {
      profile: PROFILE_ID
    }
  });

  subscriptionChannel.on('subscribe', function () {
    console.log('Subscription performed.');
  });

  subscriptionChannel.on('message', function (message) {
    // We received a message. This means that some user has opened your device type's
    // interface in the muzzley smartphone app. The message is either requesting a
    // property's status or setting it to a new value.
    // The exact target of the message (which channel/device, component and property)
    // can be seen in the message's payload.

    console.log('Message received.');
    console.log('Payload:', message.getPayload());
    console.log('User:', message.getUser());

    if (typeof respond === 'function') {
      // This is a status request. Get the device property
      // value and send it back to the client.
      if (message.getPayload().property === 'brightness') {
        return respond(true, 'Success', { value: 0.9 });
      }
    }
  });
  subscriptionChannel.on('error', function (err) {
    console.log('Error subscribing:', err);
  });
});

// When there's a state change of any of the devices managed by you, you should
// inform muzzley so that all the users that have your interface open on their
// smartphones, can see the state change in real-time.
function myDeviceChanged(channel, component, property, data) {
  muzzley.publish({
    namespace: 'iot',
    payload: {
      profile: PROFILE_ID,
      channel: 'updated-channel-id',
      component: 'updated-component-id',
      property: 'updated-property-id',
      data: {
        value: 25
      }
    }
  });
}

setTimeout(myDeviceChanged, 2000);

// Optional event handlers that can help you debug your app
// and be aware of network problems.

muzzley.on('connectError', function (err) {
  console.log('[connectError] Error connecting:', err);
});
muzzley.on('connectTimeout', function (timeout) {
  console.log('[connectTimeout] Connection timeout (ms):', timeout);
});
muzzley.on('reconnectAttempt', function (attempt) {
  console.log('[reconnectAttempt] Attempting to reconnect:', attempt);
});
muzzley.on('reconnect', function (attempt) {
  console.log('[reconnect] Successfully reconnected after attempt:', attempt);
});
muzzley.on('reconnectError', function (err) {
  console.log('[reconnectError] Error reconnecting:', err);
});
muzzley.on('reconnectFailed', function () {
  console.log('[reconnectFailed] Could not reconnect after max defined attempts');
});
muzzley.on('error', function (err) {
  console.log('[error] Generic error:', err);
});
muzzley.on('disconnect', function () {
  console.log('[disconnect] Disconnected!');
});

muzzley.on('debug', function (obj) {
  // If you're serious about debugging, uncomment the following line
  //console.log('[debug] ', obj);
});