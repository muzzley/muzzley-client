require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{"muzzley-sdk-js":[function(require,module,exports){module.exports = require('Ic3A6R');
},{}],"Ic3A6R":[function(require,module,exports){var rpcManager = require('./rpcManager.js');
var remoteCalls = require('./remoteCalls.js');
var Eventify = require('eventify');

function Muzzley (options) {
  var _this = this;
  // TODO implement options if passed

  _this.URI = options.uri;
  _this.socket = options.socket;

  return _this;

}

Muzzley.prototype.createActivity = function(token, callback){
  var _this = this;
  _this.socket = new _this.socket('ws://platform.geo.muzzley.com:80/ws');

  socket.onopen = function()  {
    _this.rpcManager = new rpcManager(_this.socket);
    _this.remoteCalls = new remoteCalls(_this.socket, _this.rpcManager);
  };

  socket.onmessage = function(message) {
    var MESSAGE_TYPE_REQUEST = 1;
    var MESSAGE_TYPE_RESPONSE = 2;
    var MESSAGE_TYPE_REQUEST_CORE = 3;
    var MESSAGE_TYPE_RESPONSE_CORE = 4;
    var MESSAGE_TYPE_SIGNAL = 5;

    if (typeof message !== 'object') {
      try {
        message = JSON.parse(message);
      } catch (e) {
        //console.log('Received an invalid non-JSON message. Ignoring.');
        //console.log(e);
        return;
      }
    }
  };

  socket.onclose = function()  {

  };

};


Muzzley.prototype.joinActivity = function(token, callback){

};


module.exports = Muzzley;
},{"./rpcManager.js":1,"./remoteCalls.js":2,"eventify":3}],1:[function(require,module,exports){function rpcManager (socket, options) {
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

  if (correlationId in requests) {
    var entry = this.requests[correlationId];
    clearTimeout(entry.timeout);
    delete requests[correlationId];
    entry.callback(null, message);
  }

};

rpcManager.prototype.generateCid = function () {
  return ++this.cidCount;
};

// SaveRequest to handle the callback or to throw a error if timeout
rpcManager.prototype.saveRequest = function (message, responseCallback){
  var _this = this;
  var correlationId = this.generateCid();

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
  saveRequest(message, responseCallback); //save the request

  var MESSAGE_TYPE_REQUEST = 1;
  // Inject the Correlation Id into the message header
  // and set the message type as REQUEST (if not already set).
  message.h = message.h || {};
  message.h.cid = correlationId;
  message.h.t = message.h.t || MESSAGE_TYPE_REQUEST;

  if (typeof message === 'object') {
    this.socket.send(JSON.stringify(message));
  } else {
    this.socket.send(message);
  }


};

module.exports = rpcManager;

},{}],2:[function(require,module,exports){function remoteCalls (socket, rpcManager, options) {
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

remoteCalls.prototype.auth = function (token, callback) {
  var msg = {
    'a': 'loginUser',
    'd': {
      'token': token
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
  this.rpcManager.makeRequest(msg, this.sock, callback);
};

remoteCalls.prototype.joinActivity = function (activityId, callback) {
  var msg = {
    'a': 'join',
    'd': {
      'activityId': activityId
    }
  };
  this.rpcManager.makeRequest(msg, this.ws, callback);
};

remoteCalls.prototype.sendReady = function (callback) {
  var msg = {
    'a': 'signal',
    'd': {
      'a': 'ready'
    }
  };

  this.rpcManager.makeRequest(msg, this.ws, callback);
};

remoteCalls.prototype.successResponse = function (type, cid, pid){
  var msg = {
    h: {t: type, cid: cid},
    s: true
  };

  if (pid) {
    msg.h.pid = pid;
  }

  console.log(msg);
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
},{}],3:[function(require,module,exports){(function(){// Eventify
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
},{}],4:[function(require,module,exports){muzzley = require('muzzley-sdk-js');

},{"muzzley-sdk-js":"Ic3A6R"}]},{},[4]);