require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{"/Users/brunex/Muzzley/muzzley-sdk-js/tests/browserify.js":[function(require,module,exports){
module.exports=require('kmxgGt');
},{}],"kmxgGt":[function(require,module,exports){
var muzzley = require('muzzley-sdk-js');
},{"muzzley-sdk-js":1}],2:[function(require,module,exports){
// TODO refactor the code and the saveRequest shouldn't be on the prototype


function rpcManager (socket, options) {
  // TODO implement options if passed
  this.TIMEOUT = 5000;
  this.socket = socket;
  this.cidCount = 0;
  this.requests = {};
}

rpcManager.prototype.handleResponse = function (message) {

  if (!message || !message.h || typeof message.h.cid === 'undefined') {
    // No Correlation Id defined, nothing to do here...
    return;
  }

  var correlationId = message.h.cid;

  if (correlationId in this.requests) {
    var entry = this.requests[correlationId];
    clearTimeout(entry.timeout);
    delete this.requests[correlationId];
    entry.callback(null, message);
  }

};

rpcManager.prototype.generateCid = function () {
  return ++this.cidCount;
};

// SaveRequest to handle the callback or to throw a error if timeout
rpcManager.prototype.saveRequest = function (correlationId, message, responseCallback){
  var _this = this;


  // Timeout 
  var tId = setTimeout(function (cid) {
    // If this ever gets called we didn't get a response in a timely fashion
    responseCallback(new Error("RPC Timeout @ cid " + cid));
    // delete the entry from hash
    delete _this.requests[cid];
  }, _this.TIMEOUT, correlationId);

  // create a request entry to store in a hash
  var entry = {
    callback: responseCallback,
    timeout: tId // the id for the timeout so we can clear it
  };

  // Put the entry in the hash so we can match the response later
  _this.requests[correlationId] = entry;

};

// makeRequest function
rpcManager.prototype.makeRequest = function (message, responseCallback){
  var _this = this;
  var correlationId = this.generateCid();

  _this.saveRequest(correlationId, message, responseCallback); //save the request

  var MESSAGE_TYPE_REQUEST = 1;
  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

  if (typeof message === 'object') {
    _this.socket.send(JSON.stringify(message));
  } else {
    _this.socket.send(message);
  }


};

module.exports = rpcManager;

},{}],3:[function(require,module,exports){
function remoteCalls (socket, rpcManager, options) {
  // TODO implement options if passed
  this.rpcManager = rpcManager;
  this.socket = socket;
}


remoteCalls.prototype.handShake = function(callback){

  var msg = {
    a: 'handshake',
    d: {
      // Mandatory
      protocolVersion: '1.0',
      // All the following are optional and experimental
      lib: 'nodejs',
      userAgent: 'muzzley-sdk-js',
      connection: 'LAN',
      contentType: 'application/json'
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.authApp = function (token, callback) {
  var msg = {
    'a': 'loginApp',
    'd': {
      'token': token
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.authUser = function (token, callback){
  var msg = {
    a: 'loginUser',
    d: {
      token: token
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.createActivity = function (activityId, callback){
  var msg = {
    a: 'create',
    d: {
      protocolVersion: '1.0',
      lib: 'js',
      libVersion: '0.1',
      activityId: activityId
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.joinActivity = function (activityId, callback){
  var msg = {
    a: 'join',
    d: {
      activityId: activityId
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.changeWidget = function (widget, pid, callback){
  var msg = {
    h: {
      pid: pid
    },
    a: 'signal',
    d: {
      a: 'changeWidget',
      d:{
        widget: widget
      }
    }
  };
  this.rpcManager.makeRequest(msg, callback);
};


remoteCalls.prototype.sendReady = function (callback) {
  var msg = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.successResponse = function (type, cid, pid){
  var msg = {
    h: {t: type, cid: cid},
    s: true
  };

  if (pid) {
    msg.h.pid = pid;
  }

  //console.log(msg);
  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.sendSignal = function (actionObj){
  var msg  = {
    h: {
      t: 5
    },
    a: 'signal',
    d: actionObj
  };
  this.socket.send(JSON.stringify(msg));
};

module.exports = remoteCalls;
},{}],1:[function(require,module,exports){
var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var messageHandler = require('./messageHandler.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.endPoint = options.endPoint;
  _this.socket = options.socket;
  _this.logMessages = options.logMessages || true;
  _this.logSocketData = options.logSocketData || false;
  _this.participants = [];
  _this.activity = undefined;
  _this.user = undefined;
  return _this;

}

Muzzley.prototype.createActivity = function(opts, callback){
  var _this = this;

  //prepare "options" passed on arguments as "opts"
  var options = {};
  if (typeof opts === 'string'){
    options.token = opts;
  } else if (typeof opts === 'object') {
    if (opts.token)  options.token = opts.token;
    if (opts.activityId)  options.activityId = opts.activityId;
  } else {
    return callback('err');
  }

  _this.socket = new _this.socket(_this.endPoint);

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    if(_this.logMessages) console.log('##Activity: sending handShake');
    _this.remoteCalls.handShake(function(err, response){
      if(_this.logMessages) console.log('##Activity: handshaked');

      if(_this.logMessages) console.log('##Activity: sending authApp');
      _this.remoteCalls.authApp(options.token, function(err, response){
        if(_this.logMessages) console.log('##Activity: Authenticaded');

        if(_this.logMessages) console.log('##Activity: sending createActivity');
        _this.remoteCalls.createActivity(options.activityId, function(err, response){
          if(_this.logMessages) console.log('##Activity: Activity Created');

          //Create the activity object
          var activity = {
            activityId: response.d.activityId,
            qrCodeUrl: response.d.qrCodeUrl
          };

          // Enable Events on activity
          Eventify.enable(activity);

          // Add the activity object to the current context _this
          _this.activity = activity;

          return callback(null, activity);
        });
      });
    });
  };

  _this.socket.onmessage = function(message) {
    if(_this.logSocketData) console.log('##Activity MessageRecived:');
    if(_this.logSocketData) console.log(message);
    messageHandler.apply(_this, [message]);
  };

  _this.socket.onclose = function()  {

  };

};


Muzzley.prototype.joinActivity = function(userToken, activityId, callback){
  var _this = this;

  _this.socket = new _this.socket(_this.endPoint);

  _this.socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);

    if(_this.logMessages) console.log('##User: sending handShake');

    _this.remoteCalls.handShake(function(err, response){
      if(_this.logMessages) console.log('##User: handShaked');
      if(_this.logMessages) console.log('##User: sending authUser');
      _this.remoteCalls.authUser(userToken, function(err, response){
        if(_this.logMessages) console.log('##User: user Authenticaded');

        if(_this.logMessages) console.log('##User: sending joinActivity');
        _this.remoteCalls.joinActivity(activityId, function(err, response){
          if(_this.logMessages) console.log('##User: joined Activity');

          //Create the participant object
          var participant = {
            id: response.participant.id,
            name: response.participant.name,
            photoUrl: response.participant.photoUrl
          };

          // Enable Events on activity
          Eventify.enable(participant);

          // Add the activity object to the current context _this
          _this.user = participant;
          if(_this.logMessages) console.log('##User: sending Ready Notification');
          return _this.remoteCalls.sendReady(function(){
            if(_this.logMessages) console.log('##User: Recived Ready Notification');
            callback(null, _this.user);
          });
        });
      });
    });
  };

  _this.socket.onmessage = function(message) {
    if(_this.logSocketData) console.log('##User MessageRecived:');
    if(_this.logSocketData) console.log(message);
    messageHandler.apply(_this, [message]);
  };

};


module.exports = Muzzley;
},{"./rpcManager.js":2,"./remoteCalls.js":3,"./messageHandler.js":4,"eventify":5}],4:[function(require,module,exports){
var Eventify = require('eventify');

//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;


module.exports = function (message) {
  var _this = this;

  // Just test if the message is well parsed or parsable
  if (typeof message.data !== 'object') {
    try {
      message = JSON.parse(message.data);
    } catch (e) {
      console.log('Received an invalid non-JSON message. Ignoring.');
      //console.log(e);
      return;
    }
  }

  // If the message is a Response it need to be handled by the rpcManager
  if (message.h.t  === MESSAGE_TYPE_RESPONSE){
    return _this.rpcManager.handleResponse(message);
  }

  // If the message is a signal
  if (message.h.t  === MESSAGE_TYPE_SIGNAL){

    if (message.d.w === 'hb') {
      //{"h":{"t":5},"a":"signal","d":{"w":"hb","c":"hb","v":"hb","e":"hb"}}
      if(_this.logMessages) console.log('##Activity heartBeat');
      return;
    }
    // loop trought all participants 
    _this.participants.forEach(function(participant){

      //Find the participant who sent the signal
      if (participant.id === message.h.pid){

        //Emit the action of the participant
        participant.trigger('action', message.d);
      }
    });
  }


  // If the message is a core Request
  if (message.h.t  === MESSAGE_TYPE_REQUEST_CORE){
    // if is a participant join 
    if (message.a ==='participantJoined'){
      if(_this.logMessages) console.log('##Activity: Recived ParticipantJoined');
      //Create a new partcipant object
      var participant  = (function (_this) {
        return {
          id: message.d.participant.id,
          name: message.d.participant.name,
          photoUrl: message.d.participant.photoUrl,
          changeWidget:function(widget, callback) {
            if(_this.logMessages) console.log('##Activity request to changeWidget');
            _this.remoteCalls.changeWidget(widget, this.id, callback);
          }
        };
      }(_this));

      // Enable Events on activity
      Eventify.enable(participant);

      //Save the participant to participants array
      _this.participants.push(participant);

      // Reply to the server with a success Response
      //
      // ATTENTION:doesnt emit the 'participantJoin' event 
      // it will be triggered down on a MESSAGE_TYPE_REQUEST event from the server
      if(_this.logMessages) console.log('##Activity: Sending joined Notification');
      return _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE_CORE, message.h.cid, participant.id);
    }

    // If is a participant quit
    if (message.a ==='participantQuit'){

      // Loop trought all participants
      _this.participants.forEach(function(participant){

        // Find the participant who quited the activity
        if (participant.id === message.d.participantId){

          // override changeWidget method
          participant.changeWidget = function(){
            return "participant allready quited activity";
          };

          // Emit the quit event
          participant.trigger('quit', message.a);
          return _this.activity.trigger('participantQuit', participant);
        }
      });
    }
  }

  // Check if the message is a request
  if (message.h.t  === MESSAGE_TYPE_REQUEST){
    // if the request is a signal
    if (message.a ==='signal'){

      // if is a ready signal of the 'participantJoin'
      if (message.d.a === 'ready'){
        if(_this.logMessages) console.log('##Activity: Participant Ready Notification Received');
        //loop trought all participants to Find the participant object to trigger the event of 'participantJoin'
        _this.participants.forEach(function(participant){
          // check the pid with our participant
          if (participant.id === message.h.pid){
            // Send a success response back
            if(_this.logMessages) console.log('##Activity: Sending Ready Notification Response');
            _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid, message.h.pid);
            // Emit the 'participantJoin' event
            if(_this.logMessages) console.log('##Activity: trigger "participantJoin" event');
            return _this.activity.trigger('participantJoin', participant);
          }
        });
      }

      if (message.d.a === 'changeWidget') {
        if(_this.logMessages) console.log('##User: Recived changeWidget request');
        if(_this.logMessages) console.log('##User: Sending changeWidget success Response');
        _this.remoteCalls.successResponse(MESSAGE_TYPE_RESPONSE, message.h.cid);

        if(_this.logMessages) console.log('##User: trigger "changeWidget" event');
        return _this.user.trigger('changeWidget', message.d.d);
      }

    }
  }
};
},{"eventify":5}],5:[function(require,module,exports){
(function(){// Eventify
// -----------------
// Copyright(c) 2010-2012 Jeremy Ashkenas, DocumentCloud
// Copyright(c) 2012 Bermi Ferrer <bermi@bermilabs.com>
// MIT Licensed


// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback functions
// to an event; trigger`-ing an event fires all callbacks in succession.
//
//     var object = {};
//     Eventify.enable(object);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
(function (root) {
  'use strict';

  // Eventify, based on Backbone.Events
  // -----------------

  var EventifyInstance,
    // Save the previous value of the `Eventify` variable.
    previousEventify = root.Eventify,

    // Regular expression used to split event strings
    eventSplitter = /\s+/,

    // Defines the name of the local variable the Eventify library will use
    // this is specially useful if window.Eventify is already being used
    // by your application and you want a different name. For example:
    //    // Decare before including the Eventify library
    //    var localEventifyLibraryName = 'EventManager';
    localName = root.localEventifyLibraryName || "Eventify",

    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    keys = Object.keys || function (obj) {
      if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
        throw new TypeError("keys() called on a non-object");
      }
      var key, keys = [];
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys[keys.length] = key;
        }
      }
      return keys;
    },

    // Create a safe reference to the Eventify object for use below.
    Eventify = function (options) {
      return this;
    };

  Eventify.prototype = {

    version: "0.3.3",

    // Event Functions
    // -----------------

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function (events, callback, context) {
      var calls, event, list;
      if (!callback) {
        return this;
      }

      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      event = events.shift();
      while (event) {
        list = calls[event] || (calls[event] = []);
        list.push(callback, context);
        event = events.shift();
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    off: function (events, callback, context) {
      var event, calls, list, i;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) {
        return this;
      }
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      if (events) {
        events = events.split(eventSplitter);
      } else {
        events = keys(calls);
      }

      // Loop through the callback list, splicing where appropriate.
      event = events.shift();
      while (event) {
        if (!(list = calls[event]) || !(callback || context)) {
          delete calls[event];
          event = events.shift();
          continue;
        }

        for (i = list.length - 2; i >= 0; i -= 2) {
          if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
            list.splice(i, 2);
          }
        }
        event = events.shift();
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function (events) {
      var event, calls, list, i, length, args, all, rest;
      if (!(calls = this._callbacks)) {
        return this;
      }

      rest = [];
      events = events.split(eventSplitter);
      for (i = 1, length = arguments.length; i < length; i = i + 1) {
        rest[i - 1] = arguments[i];
      }

      // For each event, walk through the list of callbacks twice, first to
      // trigger the event, then to trigger any `"all"` callbacks.
      event = events.shift();
      while (event) {
        // Copy callback lists to prevent modification.
        all = calls.all;
        if (all) {
          all = all.slice();
        }
        list = calls[event];
        if (list) {
          list = list.slice();
        }

        // Execute event callbacks.
        if (list) {
          for (i = 0, length = list.length; i < length; i += 2) {
            list[i].apply(list[i + 1] || this, rest);
          }
        }

        // Execute "all" callbacks.
        if (all) {
          args = [event].concat(rest);
          for (i = 0, length = all.length; i < length; i += 2) {
            all[i].apply(all[i + 1] || this, args);
          }
        }
        event = events.shift();
      }
      return this;
    },

    // Utility Functions
    // -----------------

    // Run Eventify in *noConflict* mode, returning the `Eventify`
    // variable to its previous owner. Returns a reference to
    // the Eventify object.
    noConflict: function () {
      root.Eventify = previousEventify;
      return this;
    },

    // Adds the methods on, off and trigger to a target Object
    enable: function (target) {
      var i, len,
        methods = ['on', 'off', 'trigger'];
      target = target || {};
      for (i = 0, len = methods.length; i < len; i = i + 1) {
        target[methods[i]] = this[methods[i]];
      }
      return target;
    }

  };


  // Export an Eventify instance for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `Eventify` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  EventifyInstance = new Eventify();
  // Sets Eventify on the browser window or on the process
  ((typeof exports !== 'undefined') ? exports : root)[localName] = EventifyInstance;
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = EventifyInstance;
    }
  }

// Establish the root object, `window` in the browser, or `global` on the server.
}(this));
})()
},{}]},{},[])
;