# muzzley-client

[Muzzley](https://www.muzzley.com). All your smart things, one common interface.

If you're an IoT manufacturer or developer, you can get started with muzzley by adding your own devices to our system. This library is the JavaScript / Node.js client for the real-time communication between your devices and the muzzley cloud.

If you prefer, you can alternatively use our [C++ library](https://github.com/muzzley/muzzley-client-cpp).

## Getting Started

To get a better understanding of muzzley in general and how to integrate an IoT object with us, please read our [integration documentation](https://www.muzzley.com/documentation/integration/integration.html).

## Install

To use the library, you first need to add it to your project:

    npm install muzzley-client

## Usage

The following code snippet shows how to quickly get started with the muzzley client library:

    var Muzzley = require('muzzley-client');

    var muzzley = new Muzzley();
    muzzley.initApp({ token: 'Your App Token' }); // Get yours at muzzley.com

    muzzley.on('connect', function () {

      // Subscribe to your device type's messages. That is, to the instructions
      // that your users perform in the muzzley smartphone app.
      var subscriptionChannel = muzzley.subscribe({
        namespace: 'iot',
        payload: {
          profile: '...' // Your Profile identifier generated at muzzley.com.
        }
      });

      subscriptionChannel.on('subscribe', function () {
        console.log('Subscription successfully performed');
      });

      subscriptionChannel.on('message', function (message) {
        // One of your users is requesting her device's status or
        // trying to control it.
        console.log('Message received.');
        console.log('Payload:', message.getPayload());
        console.log('Sending User:', message.getUser());
      });
    }

    // When you detect a change in your device, you can let muzzley know.
    // All users controlling the specific device on their smartphones will
    // immediately see the updated device status.
    muzzley.publish({
      namespace: 'iot',
      payload: {
        io: 'i',          // You're `i`nforming interested parties about a new status.
        profile: '...',   // Your Profile identifier generated at muzzley.com.
        channel: '...',   // Your own channel (device) id.
        component: '...', // Your component id such as 'bulb-1'.
        property: '...',  // A property's id such as 'brightness'.
        data: {           // Your property's specific data.
          value: 0.9
        }
      }
    });

## API Documentation

## Instantiation 

    var Muzzley = require('muzzley-client');
    var options = {};
    var muzzley = new Muzzley(options);

Creates a new muzzley instance. All `options` are optional and there should be no need for them. However, if you're curious, check the constructor's documentation in file `lib/index.js`.

## Events

The muzzley instance is an `EventEmitter` and you can listen to the following events:

* `error`: Fired upon an error. Parameters: An Error object.
* `connect`: Fired upon a successful connection.
* `connectError`: Fired upon a connection error. Parameters: An Error object.
* `connectTimeout`: Fired upon a connection timeout.
* `reconnect`: Fired upon a successful reconnection. Parameters: The reconnection attempt number.
* `reconnectAttempt`: Fired upon a reconnection attempt.
* `reconnectError`: Fired upon a reconnection attempt error. Parameters: An Error object.
* `reconnectFailed`: Fired upon a reconnection attempt.
* `disconnect`: Fired when the connection to the muzzley servers disconnected. The reconnection process starts right away so there should be no need for the developer to perform any other action.
* `debug`: Fired when certain key actions that are important for debugging are performed and logs all incoming and outgoing messages. Emits an object with properties `type` and `message`.

**Example**

    muzzley.on('disconnect', function (obj) {
      console.log('Disconnected!');
    });

## Methods

### `initApp()`

This method connects your IoT manager (app) with the muzzley platform.

**Method signature**

    muzzley.initApp(options:Object);

**Arguments**

* `options`: An object with the following properties:
    * `token`: The Application Token that can be generated at [www.muzzley.com](https://www.muzzley.com).

**Example**

    var muzzley = new Muzzley();
    muzzley.initApp({ token: 'your-app-token' });
    muzzley.on('connect', function () {
      
    });

### `subscribe()`

Once you connect, you need to subscribe to the messages that refer to your manager. The result of a subscription is a `channel` object.

**Method signature**

    var channel = muzzley.subscribe(options:Object);

**Arguments**

* `options`: An object with the following properties:
    * `namespace`: The type of subscription. Just use `"iot"`.
    * `payload`: The object that represents the IoT channel (device) specification pattern. The more of these properties are provided, the more specific the subscription gets. That is, it's possible to subscribe to all messages of a given profile (device type) or just to messages of a specific device's component's property (e.g.: the brightness of a specific light bulb). The following properties are supported:
        * `profile`: Your IoT profile's identifier (generated at www.muzzley.com). Mandatory.
        * `channel`: The unique identifier (`remoteId`) you assigned to your own device. Optional.
        * `component`: A specific component's identifier of your channel. (If you have specified a `bulb` component type, this could be something like `bulb-xyz`). Optional.
        * `property`: The property identifier you want to listen to. Optional. 

**Example**

    var channel = muzzley.subscribe({
      namespace: 'iot',
      payload: {
        profile: '...' // Your Profile identifier generated at muzzley.com.
      }
    });

### `publish()`

When you need to push information to your users (muzzley's smartphone users) or muzzley in general, you use this method. It's important that you push information in real-time to muzzley so that we can learn from your devices' patterns.

**Method signature**

    muzzley.publish(options:Object);

**Arguments**

The arguments are very similar to the ones passed to the `subscribe()` method and to the ones available in the `PubSubMessage` payload (see below).

* `options`:
    * `namespace`: The PubSub namespace, always `"iot"`.
    * `payload`:
        * `io`: The type of action. In the IoT manager's case it's always `"i"` (inform).
        * `profile`: The IoT Profile the message refers to.
        * `channel`: The IoT Channel (device) the message refers to.
        * `component`: A specific component of the IoT Channel (device).
        * `property`: The property that has a new status/value.
        * `data`: The property-specific status value.

**Example**

    muzzley.publish({
      namespace: 'iot',
      payload: {
        io: 'i',
        profile: '<your profile id>',
        channel: '<e.g. your device serial number>,
        component: 'bulb-3',
        property: 'brightness',
        data: {
          value: 0.9
        }
      }
    });

## `Channel`

The `Channel` object represents a logical communication channel between your app and the muzzley servers (it's not related to the IoT Channel / device). You can see the model in the `lib/models/Channel.js` file.

As explained above, a `Channel` is created when you `subscribe()` to a certain message pattern.

**Events**

* `subscribe`: Emitted when the subscription is performed.
    * Callback function signature: `function ()`.
* `message`: Emitted each time a message of the particular subscription is received. The `message` is a `PubSubMessage` instance (see below).
    * Callback function signature: `function (message:Object[, respond:Function])`.
    * The `respond` argument is only available when the message requires a response. This is the case for `io="r"` type of messages where the smartphone client is asking the manager for the current status of a particular property. It has the following signature: `function (success:Boolean, message:String, data:Anything)`.
* `error`: Emitted when an error regarding the subscription occurs.
    * Callback function signature: `function (err:Object)`.

**Example**

    channel.on('subscribe', function () {
      console.log('Subscription successfully performed');
    });

    channel.on('message', function (message, respond) {
      console.log('Message received.');
      console.log('Payload:', message.getPayload());
      console.log('Sending User:', message.getUser());

      if (typeof respond === 'function') {
        // This is a status request. Get the device property
        // value and send it back to the client.
        respond(true, 'Success', { value: 25 });
      }
    });

    channel.on('error', function (err) {
      console.log('Error performing subscription', err);
    });

## `PubSubMessage`

The `PubSubMessage` (source at `lib/models/PubSubMessage.js`) represents a message sent from the smartphone clients as a consequence of a user's interaction. The smartphone might be requesting a device's status information (such as the current temperature of a thermostat or the brightness level of a bulb) or setting new values on the same device.

The following sections document the available methods.

### `getPayload()`

Returns the message payload. It's an object with the following properties:

* `io`: A string with the type of action. One of:
    * `"r"`: The client is reading the current value of the specified `property`.
    * `"w"`: The client is writing a new value to the specified `property`.
* `profile`: The IoT Profile the message refers to.
* `channel`: The IoT Channel (device) the message refers to. This is the `remoteId` as chosen by the manager application developer itself such as the device's serial number or some other unique identifier.
* `component`: A specific component of the device such as `"bulb-3"`.
* `property`: The property the message refers to such as `"brightness"` or `"temperature"`.
* `data`: When `io` is `"w"`, this represents the data that is being set on the current `property`.

### `getUser()`

Returns the muzzley user that performed the request on her smartphone. The object has the following properties:

* `profileId`: The user's muzzley id.
* `name`: The user's name.