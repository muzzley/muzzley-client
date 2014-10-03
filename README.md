# muzzley-client

This document describes how to use the muzzley client library.

## Install

To use the library you first need to add it to your project:

```
npm install muzzley-client
```

## Usage

The following code snippet shows how to quickly get started with the muzzley client library:

```
var muzzley = require('muzzley-client');

muzzley.connectApp('yourAppToken', function(err, activity) {
  if (err) return console.log("err: " + err);
  console.log(activity);

  activity.on('participantJoin', function(participant) {
    console.log(participant);

    participant.changeWidget('gamepad', function(err) {
      if (err) return console.log("err: " + err );
      console.log('Activity: changeWidget was successful');

      participant.on('quit', function() {
        console.log('quit');
      });

      participant.on('action', function(action) {
        // Action object represents the participant's interaction
        console.log(action);
      });

    });

  });

});
```

## API Documentation

```
var muzzley = require('muzzley-client');
```

Creates a new muzzley instance.

## Events

The muzzley instance is an `EventEmitter` and you can listen to the following events:

`error` This event is emitted every time an error occurs during the activity.

```
muzzley.on('error', function(err) {
  console.log(err);
});
```

Some `error` messages are also sent via xhr to our servers, if you don't want this behavior you can simple turn it off

```
muzzley.sendErrors = false;
```

## Methods

### muzzley.connectApp()

This method connects your app with the muzzley platform and creates an activity.

The simple way to use it, is just passing your application `token` which you can get from www.muzzley.com.

```
var token = 'yourAppToken';
muzzley.connectApp(token, callback);
```


It is also possible to pass an `options` object with the `token` and the `activityId` that should be used for the new activity. For the muzzley platform to accept the provided `activityId`, it must be a valid static activity id of the current application (defined by the application `token`). The static activity ids are generated in the muzzley.com web site when viewing an application's details.

```
var options = {
  token:'123sda',
  activityId: 'weee'
};

muzz.connectApp(options, callback);
```

The `callback` function will receive an `err` and an `activity` object.

```
function callback(err, activity) {

}
```

#### activity

The `activity` object is returned in the callback of the `muzzley.connectApp` function and will have the activity's properties:

```
{
  activityId: '940232',
  qrCodeUrl: 'http://alpha.muzzley.com/qrcode/940232'
}
```


The `activity` object is also an `EventEmitter`. You can listen to the following events:

```
function callback(err, activity) {
  activity.on('participantJoin', join);

  activity.on('participantQuit', quit);
}
```

`participantJoin` This event is emitted every time a user joins the activity.

`participantQuit` This event is emitted when a user quits the activity.

Each of these event functions will receive a `participant` object.

```
function join(participant) {
  
}

function quit(participant) {
  
}
```

#### participant

The `participant` object will have the activity participant's properties:

```
{
  id: 1,
  name: 'Participant Name',
  photoUrl: 'http://example.com/picture.jpg'
}
```

The `participant` is also an `EventEmitter` that emits the following events:

`action` This event is emitted every time a participant interacts and receives an `action` object that represents the participant's interaction.

```
participant.on('action', function (action) {
  // Action object represents the participants interaction
  console.log(action);
});
```

`sharingInvitation` This event is emitted every time a participant starts a `share` from `assetsPicker` widget and you need to accept it or reject (if you ignore it will do a timeout).

```
participant.on('sharingInvitation', function (invite, cbAccept) {
  // invite object contains the invitation properties
  console.log(invite);

  var reason = 'the reason why you accept or reject'

  // you need allways to call the callback with true or false and a reason
  // true accepts the invitation
  // false rejects

  cbAccept(true, reason);
});
```

`sharingFile` This event is emitted every time a participant is actualy sending a file (if you don't accept the `sharingInvitation` you will never get this event)

```
participant.on('sharingFile', function (file) {
  // "file" object contains all information about the file 
  console.log(file);
});

```

`sharingCancel` This event is emitted when a share process is canceled

```
participant.on('sharingCancel', function (share) {
  // share object represents the share that was canceled
  console.log(share);
});

```


`sharingEnd` This event is emitted every time a share process ends

```
participant.on('sharingEnd', function (share) {
  // share object represents the shareInvitation that ended
  console.log(share);
});

```

`sendMediaStream` This event is emitted every time a participant starts a stream from widget `cameraStream`

```
participant.on('sendMediaStream', function (stream) {
  // stream object contains all information about the stream
  console.log(stream);
});

```


`quit` This event is emitted when the participant quits the activity.

```
participant.on('quit', function () {
  
});
```
#### participant.changeWidget()

The `changeWidget` method instructs the participant's device (smartphone) to transform itself into the given widget identifier. After a successful transformation - or if some error occurs - the `callback` argument is called.

```
participant.changeWidget('widget identifier', callback);
```

The possible widgets are referenced in the muzzley documentation at http://www.muzzley.com/documentation


-----------

### muzz.connectUser()

This method allows you to connect to a muzzley activity as a participant.

```
var userToken = 'guest'; 
var activityId = '14e0f3';
muzz.connectUser(userToken, activityId, callback);
```
The `callback` function will recive an `err` and a `user` object;

```
function callback(err, user) {
  
}
```

##### user

The `user` object will have the participant's properties:

```
{ 
  id: 1,
  name: 'muzzley dev',
  photoUrl: 'http://graph.facebook.com/123/picture?type=large'
}
```
The `user` is also an event-emitter, and you can listen for `changeWidget` events:

```
user.on('changeWidget', function (widget) {
  
});
```

the `changeWidget` event recives a `widget` string with the name of the widget wich this participant should transform

After you recive this event you can start sending widget data for that you call `user.sendWidgetData`

```
user.sendWidgetData({
	"w": "gamepad",
	"c": "b",
	"v": 1,
	"e": 2
});
```


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/muzzley/muzzley-client/trend.png)](https://bitdeli.com/free "Bitdeli Badge")