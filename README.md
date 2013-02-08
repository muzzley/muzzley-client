
# Muzzley javascript sdk

**Version: 0.0.1 Draft**

This document describes how to use the muzzley javascript SDK.

## How to use install

In the folder `./html/js` you have the lib ready to use just copy to your site.

## How to use:

include the muzzley sdk on you site:

    <script src="js/muzzley-sdk.js"></script>

then inside another `<script>` tag your are ready to use the lib:

      var muzzley = require('/lib/main');
      // Connect to muzzley server with your token
      muzzley.connect('token1', function (activity) {

        // You get a activity object with all activity settings
        console.log(activity); 

        // You start listening for the 'participantJoin' Event
        activity.on('participantJoin', function (participant) {

          // You get a participant object with all participant settings
          console.log(participant); 

          // You need tell the participant to transform into some widget
          // In this case we'll use the Gamepad widget
          participant.changeWidget('gamepad', function (err) {

            // If you get no err then you can start listening for participant actions
            if (!err) {

              // Start listening for the "action" Events
              participant.on('action', function (action) {
                // Action object represents the participants interaction
                console.log(action);
              });
            }
          });
        });
      });

## How to modify the code:

In the folder `./lib` you have the lib files.
The `main.js` is the app entry point.

## Recompile

After you modify something you need to 'recompile' the code, for that you need to run `node index.js` and it will recompile the javascript file `./html/js/muzzley-sdk.js` 

### Test 
when you run `node index.js` it also mounts an http server running the library with the following adress: 
`http://localhost:8081/index.html`

