# muzzley-client

[Muzzley](https://www.muzzley.com) is a platform to carry all your connected devices in your pocket anytime, anywhere. It’s a single entry point for your smart world and allows consumers to interact, in one single app, with all their connected devices, access to their activities and receive important notifications from them. If you are an IoT developer and/or business, you can get started with Muzzley by creating your own connected apps and widgets (or use the ones we provide off-the-shelf) and use them to engage with your users and/or customers.

This library is the JavaScript / Node.js client for connecting to the muzzley platform.

## Install

To use the library you first need to add it to your project:

    npm install muzzley-client

## Usage

The following code snippet shows how to quickly get started with the muzzley client library:

    var Muzzley = require('muzzley-client');

    var muz = new Muzzley();

    muz.connectApp({
      token: process.env.APP_TOKEN || 'your-app-token' // Get yours at https://www.muzzley.com
    });

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

**Note**: You can create your App Token at [www.muzzley.com](http://www.muzzley.com).

## API Documentation

## Instantiation 

    var Muzzley = require('muzzley-client');
    var options = {};
    var muz = new Muzzley(options);

Creates a new muzzley instance. All `options` are optional. The following are supported:

* `secure`: Whether to use SSL. Optional. Boolean. Default: false.
* `sendErrors`: Boolean indicating whether network errors should be logged remotely. Default: true.
* `connectTimeout`: After how many milliseconds is a connection attempt aborted. Default: 15000.
* `reconnect`: Whether to reconnect on connection error. Boolean. Default: true.
* `reconnectionDelay`: The initial timeout to start a reconnect, this is increased using an exponential back off algorithm each time a new reconnection attempt has been made. Default: 500.
* `reconnectionLimit`: The maximum reconnection delay in milliseconds, or Infinity. Default: 300000 (5 min).
* `reconnectionAttempts`: How many times should we attempt to reconnect with the server after a a dropped connection. After this we will emit the `reconnectFailed` event. Default: Infinity.
* `idleTimeout`: Internal. You should not need to use this. Defines how much time in milliseconds after the last received message we consider that the connection has died. Default: 60000.

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
* `disconnect`: 

Example:

    muz.on('disconnect', function (obj) {
      console.log('Disconnected!');
    });

## Methods

### connectApp(options[, callback])

This method connects your app with the muzzley platform and creates an activity. An activity is an instance of an application that's connected to muzzley.

**Method signature**

    connectApp(options[, callback]);

**Arguments**

* `options`: An object with the following properties:
    * `token`: The Application Token that can be generated at [www.muzzley.com](https://www.muzzley.com).
    * `activityId`: Optional. The static activity id that should be used. You can generate a static activity id in the "App" section of the muzzley website.
* `callback`: **Deprecated**. Use the `muzzley.on('connect')` event instead. A function that will be called once the activity has been created. The function signature is `function (err, activity)`.

**Example**

    var muz = new Muzzley();
    muz.connectApp({ token: 'your-app-token' });
    muz.on('connect', function (activity) {
      // Activity has been created.
    });

#### activity

The `activity` object contains the properties of the created activity (the application instance).

    {
      "activityId": "abc123",
      "qrCodeUrl": "http://alpha.muzzley.com/qrcode/abc123"
    }

The `activity` object is an `EventEmitter` as well. It emits the following events:

* `participantJoin`: This event is emitted every time a user (usually a smartphone) joins the activity.
* `participantQuit`: This event is emitted when a user quits the activity.

    activity.on('participantJoin', function (participant) {
    });
    activity.on('participantQuit', function (participant) {
    });

#### participant

The `participant` object represents a user that joined the activity and contains her properties.

    {
      id: 1,
      name: 'Participant Name',
      photoUrl: 'http://example.com/picture.jpg'
    }

The `participant` is also an `EventEmitter` that emits the following events:


* `quit` This event is emitted when the participant quits the activity. It's an alternative to the `activity.on('participantQuit')` event. 

    participant.on('quit', callback);

* `action`: This event is emitted every time a participant interacts and receives an `action` object that represents the participant's interaction.

    participant.on('action', function (action) {
      // Action object represents the participants interaction
      console.log(action);
    });

* `sharingInvitation`: This event is emitted every time a participant starts a `share` from `assetsPicker` widget and you need to accept it or reject (if you ignore it will do a timeout).

    participant.on('sharingInvitation', function (invite, cbAccept) {
      // invite object contains the invitation properties
      console.log(invite);

      var reason = 'the reason why you accept or reject'

      // you need allways to call the callback with true or false and a reason
      // true accepts the invitation
      // false rejects

      cbAccept(true, reason);
    });

* `sharingFile`: This event is emitted every time a participant is actualy sending a file (if you don't accept the `sharingInvitation` you will never get this event)

    participant.on('sharingFile', function (file) {
      // "file" object contains all information about the file 
      console.log(file);
    });

* `sharingCancel`: This event is emitted when a share process is canceled:

    participant.on('sharingCancel', function (share) {
      // share object represents the share that was canceled
      console.log(share);
    });


* `sharingEnd`: This event is emitted every time a share process ends

    participant.on('sharingEnd', function (share) {
      // share object represents the shareInvitation that ended
      console.log(share);
    });

* `sendMediaStream`: This event is emitted every time a participant starts a stream from widget `cameraStream`

    participant.on('sendMediaStream', function (stream) {
      // stream object contains all information about the stream
      console.log(stream);
    });

#### participant.changeWidget()

The `changeWidget` method instructs the participant's device (smartphone) to transform itself into the given widget identifier. After a successful transformation - or if some error occurs - the `callback` argument is called.

    participant.changeWidget('widget identifier', callback);

The possible widgets are referenced in the muzzley documentation at http://www.muzzley.com/documentation





### connectUser(options[, callback])

This method allows you to perform a user connection to the muzzley platform and join an activity. An activity is an instance of an application that's connected to muzzley. Using these methods you can act as a muzzley participant much like the muzzley smartphone applications do.

**Method signature**

    connectUser(options[, callback]);

**Arguments**

* `options`: An object with the following properties:
    * `token`: The User Token. Currently only `"guest"` is supported.
    * `activityId`: The activity id of the muzzley application instance that you want to pair to.
* `callback`: **Deprecated**. Use the `muzzley.on('connect')` event instead. A function that will be called once the activity has been created. The function signature is `function (err, user)`.

**Example**

    var muz = new Muzzley();
    muz.connectApp({ token: 'your-app-token' });
    muz.on('connect', function (user) {
      // Activity has been created.
    });

##### user

The `user` object will have the participant's properties:

* `id`: The user's identifier in the context of the joined activity. Example: 3.
* `profileId`: The unique id of the user. Example: 1000000,
* `name`: The user's name. Example: "John Doe".
* `photoUrl`: An URL of the user's photo. Example: "https://www.muzzley.com/imgs/DefaultProfilePic.png".
* `deviceId`: The user's unique device id. Example: "88c71d8c-8577-4fd9-bc9f-287ea71b36ba".

The `user` is also an event-emitter, and you can listen for `changeWidget` events:

    user.on('changeWidget', function (widget) {
    });

The `changeWidget` event recives a `widget` string with the name of the widget wich this participant should transform

After you recive this event you can start sending widget data for that you call `user.sendWidgetData`

    user.sendWidgetData({
      "w": "gamepad",
      "c": "b",
      "v": 1,
      "e": 2
    });

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/muzzley/muzzley-client/trend.png)](https://bitdeli.com/free "Bitdeli Badge")