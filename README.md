# muzzley-client

This document describes how to use the muzzley client library.

## Install

To use the library you first need to add it to your project:

```
npm install winston
```

## Usage

The following code snippet shows how to quickly get started with the muzzley client library:

```
var muzzley = require('muzzley-client');

muzzley.connectApp('yourAppToken', function(err, activity){
  if (err) return console.log("err: " + err);
  console.log(activity);

  activity.on('participantJoin', function(participant) {
    console.log(participant);

    participant.changeWidget('gamepad', function(err) {
      if (err) return console.log("err: " + err );
      console.log('Activity: recived changeWidget okay');

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

The muzzley instance is an `EventEmitter` and you can listen for the fowllowing events:

`error` This event is emmited everytime an error happens during your activity.

```
muzzley.on('error', function(err) {
  console.log(err);
});
```

## Methods

### muzzley.connectApp

This method connects your app with the muzzley platform and creates an activity.

The simple way to use it, is just passing your application `token` which you can get from www.muzzley.com.

```
var token = '123sda';
muzzley.connectApp(token, callback);
```

The `callback` function will receive an `err` and an `activity` object.

```
function callback(err, activity) {
  
}
```
#### activity

The `activity` object is returned on the callback function of the `muzzley.connectApp` and will have your activity settings:

```
{ 
  activityId: '940232',
  qrCodeUrl: 'http://alpha.muzzley.com/qrcode/940232' 
}
```

The `activity` is also an `EventEmitter`. You can listen the fowlloing events:

```
function callback(err, activity) {
  activity.on('participantJoin', join);

  activity.on('participantQuit', quit);
}
```

`'participantJoin'` This event is emmited everytime a user joins your activity.

`'participantQuit'` This event is emmited everytime a user quits your activity.

Each of this event functions will recive a `participant` object.

```
function join(participant) {
  
}

function quit(participant) {
  
}
```

#### participant

The `participant` object will have your participant settings:

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

`action` This event is emitted everytime a participant interacts and recives an action object that represents the participant's interaction.

`quit` This event is emitted when the participant quits your activity.

## Tests

Comming soon.