# muzzley-sdk-js

**Version: 0.1.0 Draft**

This document describes how to use the muzzley javascript SDK.

## Installing and using
To install the sdk you have some "recipes"


### On the browser
the first "recipe" is the classic way you just need to add the <script> tag on your site with the muzzley-sdk.js and your ready to go

### Browserify
this recipe uses browserify that is a node-style require() to organize your browser code and load modules installed by npm.

### Node.js


### Ender support
soon.
### bower support
soon.

## API Documentation
soon.

## Modify and test

Before you run the tests you need to run "npm install" inside the /tests dir 


We have some type of tests

###First we have tests for distribution
In this tests we actualy compile the sdk and serve it to be tested on browsers trought the diferent "recipes"

To run the browser tests you just need to run the following command: node /tests/testbrowser.js

This will mount a http-server on the the following url: "http://localhost:8081/", it will also compile the sdk, the compiled result will go to the "/tests/public/" dir and will be the fowlloing files:

test-sdk-browserify.js: that is compiled using browserify and the muzzley-sdk is used trought the commongjs "require" convenction, the code of this test that can be found on the /tests/browsererify.js file


test-sdk-dist.js: this is a compiled version of the muzzley-sdk to be used stand alone (like jquery) you just need to add the <script> tag and your ready to go.

to actualy test it you just need to open the browser with the fowlloing urls :

"http://localhost:8081/dist.html": this is the distribution more tipical is just include the js file 

"http://localhost:8081/browserify.html": this is the distribution that is generated trought browserify


We also have some node.js tests, this one works like browserify(just use "require"), and the file to run the tests is /tests/testNode.js


Attention: if you modify something on the lib you need to push all modifications to bitbucket and run again "npm install" on the /tests dir, this appens because the package.json inside of the dir /tests actualy points to the muzzley-sdk-js on the bitbucket repository, to make sure that tests are running more likely a production env.


###API tests, this is the tests that actualy test the sdk api:



