# muzzley-sdk-js

**Version: 0.1.0 Draft**

This document describes how to use the muzzley javascript SDK.

## Installing and using
To install the sdk you have some "recipes"


### On the browser
the first "recipe" is the classic way you just need to add the `<script>` tag on your site with the `muzzley-sdk.js` and your ready to go

### Browserify
this recipe uses browserify that is a node-style `require()` to organize your browser code and load modules installed by npm.

### Node.js
To use the library with `nodejs` first you need to add the npm manifest `package.json`:

```
{
  "name": "package-demos",
  "version": "0.0.1",
  "private": true,
  "dependencies": {
    "muzzley-sdk-js":"git+ssh://git@bitbucket.org:muzzley/muzzley-sdk-js.git#v0.1.0"
  }
}
```
You need add a dependecie called `muzzley-sdk-js` that points to our private repository of the sdk, and your ready to `require` it on your application:

```
var muzzley = require('muzzley-sdk-js');
muzzley.createActivity('asd', function(err, activity){

  console.log(activity);
  console.log('activityCreated');


  activity.on('participantQuit', function(participant){
    console.log('participantQuit');
  });
  activity.on('participantJoin', function(participant){
    console.log(participant);
    participant.changeWidget('gamepad', function (err) {
      console.log('changeWidget');

      participant.on('quit', function (action) {
        // Action object represents the participants interaction
        console.log('asd');
        console.log(action);
      });


      participant.on('action', function (action) {
        // Action object represents the participants interaction
        console.log(action);
      });
    });
  });
});
```

### Ender support
soon.
### bower support
soon.

## API Documentation

If you wanna use the lowest level of the api:

```
var muzzley = require('lib/');

var muzz = new muzzley(options)
```

Creates a muzzley instance `muzz`, it recives a
`options` object with the following properties:

*   `uri` the websocket server uri
*   `socket` the websocket library that you want to use


If you use one of our recipes (recommended):

```
var muzz = require('muzzley-sdk-js');
```
Creates a muzzley instance `muzz` ready to use, and the diference is that our library will figure out by it self what is the `uri` and the `socket` to use.

##methods:

### muzz.createActivity

This is the method to create an activity

The simple way to use is just passing a `token`, and this way the `activityId` will be dinamic and diferent everytime

```
var token = '123sda';
muzz.createActivity(token, callback)
```

You can also pass a `options` object with the `token` and the `activityId` can be defined by you

```
var options = {
  token:'123sda',
  activityId: 'weee'
}
muzz.createActivity(options, callback)
```

The `callback` function will recive a `err` and a `activity` object

```
function callback(err, activity){
  
}
```
### activity

The `activity` object will have your activity settings:

```
{ 
  activityId: '940232',
  qrCodeUrl: 'http://alpha.muzzley.com/qrcode/940232' 
}
```

The `activity` is also a event-listener, and you can listen the fowlloing events:

```
function callback(err, activity){
  activity.on('participantJoin', Join);

  activity.on('participantQuit', Quit);
}
```

`'participantJoin'` This event is emmited everytime a user joins your activity

`'participantQuit'` This event is emmited everytime a user quits your activity


each of this events functions will recive a `participant` object

```
function callback(err, activity){
  activity.on('participantJoin', Join);

  activity.on('participantQuit', Quit);
}

function Join (participant){
  
}

function Quit (participant){
  
}
```

### participant

The `participant` object will have your participant settings:

```
{ 
  id: 1,
  name: 'Bruno Barreto',
  photoUrl: 'http://graph.facebook.com/618907828/picture?type=large'
}
```
The `participant` is also a event-listener, and you need can listen the fowlloing events:

```
participant.on('action', function (action) {
  
});

 participant.on('quit', function () {
  
});
```

`'action'` This event is emmited everytime a participant interacts and recives a action object that represents the participants interaction

`'quit'` This event is emmited the participant quits your activity



## Modify and test

Before you run the tests you need to run `npm install` inside the `/tests dir` 


We have some type of tests

###First we have tests for distribution
In this tests we actualy compile the sdk and serve it to be tested on browsers trought  diferent "recipes"

To run the browser tests you just need to run the following command: `node /tests/testbrowser.js`

This will mount a http-server on the the following url: `http://localhost:8081/`, it will also compile the sdk, the compiled result will go to the `/tests/public/` dir and will be the fowlloing files:

`test-sdk-browserify.js`: that is compiled using browserify and the muzzley-sdk is used trought the commonjs "require" convenction, the code of this test that can be found on the `/tests/browsererify.js` file


`test-sdk-dist.js`: this is a compiled version of the muzzley-sdk to be used stand alone (like jquery) you just need to add the `<script>` tag and your ready to go.

to actualy test it you just need to open the browser with the fowlloing urls :

"http://localhost:8081/dist.html": this is the distribution more tipical is just include the js file 

"http://localhost:8081/browserify.html": this is the distribution that is generated trought browserify


We also have some node.js tests, this one works like browserify(just use `require`), and the file to run the tests is `/tests/testNode.js`


Attention: if you modify something on the lib you need to push all modifications to bitbucket you need to run again `npm install` on the `/tests` dir, this appens because the package.json inside of the dir `/tests` actualy points to the muzzley-sdk-js on the bitbucket repository, this is to make sure that all tests are running more likely a production env.


###API tests, this is the tests that actualy test the sdk api:


#Warning :
###This documentation is being created as you read



