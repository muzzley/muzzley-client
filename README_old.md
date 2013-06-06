# Muzzley JavaScript Library

**Version: 0.3.0 Draft**

This document describes how to use the muzzley JavaScript library.

## Installing and using

To install the library there are different "recipes" which are explained below.

### In the browser

The first recipe is the classic way. You just need to add the `<script>` referencing the correct `muzzley-client-x.y.z.min.js` file in your HTML file and you're ready to go.

### Browserify

This recipe uses (browserify)[https://github.com/substack/node-browserify "Browserify"] that is a node-style `require()` to organize your browser code and load modules installed by `npm`.

### Node.js

To use the library with Node.js first you need to add the `npm` manifest to your `package.json` file:

```
{
  "name": "package-demos",
  "version": "0.0.1",
  "private": true,
  "dependencies": {
    "muzzley-client":"*"
  }
}
```

Run `npm install`. Then you're ready to `require` it in your application as the following example shows:


```
var muzzley = require('muzzley-client');

var myAppToken = 'your app token here';

muzzley.connectApp(myAppToken, function (err, activity) {
  // The `activity` object contians the activity's id
  // and a ready-to-use QR code image to be displayed
  console.log('activityCreated');
  console.log(activity);

  activity.on('participantQuit', function (participant) {
    console.log('participantQuit');
  });

  activity.on('participantJoin', function (participant) {
    console.log(participant);
    participant.changeWidget('gamepad', function (err) {
      console.log('changeWidget');

      participant.on('quit', function () {
        // The participant quit the current activity
      });

      participant.on('action', function (action) {
        // The `action` object represents the participant's interaction
        console.log(action);
      });
    });
  });
});
```

## API Documentation

If you want to use the lowest level of the API you can follow this example:

```
var muzzley = require('muzzley-sdk-js');

var muzz = new muzzley.instance(options);
```

Creates a muzzley instance named `muzz`. It recives an `options` object with the following properties:

 * `endPoint`: the websocket server uri
 * `socket`: the websocket library that you want to use
 * `logMessages`: the flag to show log messages (default `true`)
 * `logSocketData`: the websocket server uri the flag to show log messages (default `false`)

If you use one of our recipes (recommended):

```
var muzz = require('muzzley-sdk-js');
```

This creates a new ready-to-use muzzley instance named `muzz`. Using this method, the library will figure out by itself which `uri` and `socket` to use.

## Events

The muzzley instace is an event-emitter and you can listen for the fowllowing events:

 * `error`: this event is emmited when an error occurs

```
muzz.on('error', function (err) {
  console.log(err);
});
```

## Methods

### muzz.connectApp

This method connects your app with the muzzley platform and creates an activity.

The simplest way to use it to just pass it an application `token. This way, the `activityId` will be auto-generated by the muzzley platform and will be different every time.

```
var token = '123sda';
muzz.connectApp(token, callback);
```

It is also possible to pass an `options` object with the `token` and the `activityId` that should be used for the new activity. For the muzzley platform to accept the provided `activityId`, it must be a valid static activity id of the current application (defined by the application `token`). The static activity ids are generated in the muzzley.com web site when viewing an application's details.

```
var options = {
  token:'123sda',
  activityId: 'weee'
};

muzz.connectApp(options, callback);
```

The `callback` function will recive an `err` and an `activity` object;

```
function callback(err, activity) {
  
}
```

##### activity

The `activity` object is returned in the callback function of the `muzz.connectApp` call and will have the created activity's settings:

```
{ 
  activityId: '940232',
  qrCodeUrl: 'http://alpha.muzzley.com/qrcode/940232' 
}
```

The `activity` is also an event-emitter, and you can listen the fowlloing events:

```
function callback(err, activity) {
  activity.on('participantJoin', join);

  activity.on('participantQuit', quit);
}
```

 * `'participantJoin'`: this event is emitted every time a user joins the activity
 * `'participantQuit'`: this event is emitted every time a user quits the activity

Each of these event handler functions will recive a `participant` object as shown below:

```
function callback(err, activity){
  activity.on('participantJoin', join);

  activity.on('participantQuit', quit);
}

function join(participant) {
  
}

function quit(participant) {
  
}
```

##### participant

The `participant` object will have the participant's properties:

```
{ 
  id: 1,
  name: 'Bruno Barreto',
  photoUrl: 'http://graph.facebook.com/618907828/picture?type=large'
}
```

To order a participant to transform into a given widget, the `changeWidget` method can be called on the `participant` object.

```
participant.changeWidget('switch', function (err) {

});
```

If the widget can receive parameters, they can be passed as an object in the second argument.

```
participant.changeWidget('switch', {'isOn': 1}, function (err) {

});
```


The `participant` is also an event-emitter, and you need can listen the fowlloing events:

```
participant.on('action', function (action) {
  
});

participant.on('quit', function () {
  
});
```

 * `'action'`: this event is emitted every time a participant interacts with the smartphone's widget and recives an action object that represents the participant's interaction
 * `'quit'`: this event is emitted when the participant quits the activity

### muzz.connectUser

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
user('changeWidget', function (widget) {
  
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



## Modify and test

Before you run the tests you need to run `npm install` inside the `/tests dir`.

There are a few different type of tests.

### Distribution Tests

In these tests, we actually compile the lib and serve it to be tested on browsers through different "recipes".

To run the browser tests you just need to run the following command in the command line: `node /tests/testbrowser.js`

This will mount an http-server at the the following url: `http://localhost:8081/`. It will also compile the lib. The compiled result will go to the `/tests/public/` dir and there will be the fowlloing files:

 * `test-sdk-browserify.js`: that is compiled using browserify and the muzzley-sdk is used trought the commonjs "require" convention. The code of this test can be found in the `/tests/browsererify.js` file.
 * `test-sdk-dist.js`: this is a compiled version of the muzzley-sdk to be used stand alone (like jquery) you just need to add the `<script>` tag and you're ready to go.

To actualy test it you just need to open the browser with the fowlloing urls :

 * "http://localhost:8081/dist.html": this is the most typical distribution. It just includes the js file.
 * "http://localhost:8081/browserify.html": this is the browserify-generated distribution.

There are also some node.js tests. These work like browserify (just use `require`), and the file to run the tests is `/tests/testNode.js`.

**Attention**: if you modify something in the lib you need to push all modifications to BitBucket and run `npm install` again on the `/tests` dir. This happens because the `package.json` file inside the `/tests` dir actually points to the muzzley-sdk-js on the BitBucket repository. This is to make sure that all tests are running in a production-like environment.

### API tests

Soon.

# Warning

**This documentation is being created as you read**