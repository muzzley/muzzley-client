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

## Methods

### muzzley.connectApp()

This method connects your app with the muzzley platform and creates an activity.

The simple way to use it, is just passing your application `token` which you can get from www.muzzley.com.

```
var token = 'yourAppToken';
muzzley.connectApp(token, callback);
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

The `activity` object is also an `EventEmitter`. You can listen the following events:

```
function callback(err, activity) {
  activity.on('participantJoin', join);

  activity.on('participantQuit', quit);
}
```

`'participantJoin'` This event is emitted every time a user joins the activity.

`'participantQuit'` This event is emitted when a user quits the activity.

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

```
participant.on('action', function (action) {
  
});

participant.on('quit', function () {
  
});
```

`action` This event is emitted every time a participant interacts and receives an `action` object that represents the participant's interaction.

`quit` This event is emitted when the participant quits the activity.

### muzzley.changeWidget()

The `changeWidget` method instructs the participant's device (smartphone) to transform itself into the given widget identifier. After a succesful transformation or if some error occurs, the `callback` argument is called.

```
participant.changeWidget('widget identifier', callback);
```

The possible widgets are referenced in the muzzley documentation at http://www.muzzley.com/documentation

## Tests

Coming soon.