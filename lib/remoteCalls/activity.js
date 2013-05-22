//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// Remotes calls
function remoteCalls(socket, rpcManager){
  this.socket = socket;
  this.rpcManager = rpcManager;
}


remoteCalls.prototype.successResponse = function(originalHeader){

  var msg = {
    h: originalHeader,
    s: true
  };

  if (originalHeader.t === MESSAGE_TYPE_REQUEST) {
    msg.h.t = MESSAGE_TYPE_RESPONSE;
  } else if (originalHeader.t === MESSAGE_TYPE_REQUEST_CORE) {
    msg.h.t = MESSAGE_TYPE_RESPONSE_CORE;
  }

  this.socket.send(JSON.stringify(msg));

};

remoteCalls.prototype.sendWidgetData= function (data){
  var msg = {
    h: {
      t: MESSAGE_TYPE_SIGNAL
    },
    a: 'signal',
    d: data
  };

  this.socket.send(JSON.stringify(msg));
};

remoteCalls.prototype.quit = function (data){
  var quit = {
    a: 'quit'
  };

  this.rpcManager.makeRequest(quit, function(err, muzzData){
    console.log(muzzData);
  });
};

remoteCalls.prototype.changeWidget = function (widget, params, pid, callback){
  var msg = {
    h: {},
    a: 'signal',
    d: {
      a: 'changeWidget',
      d: {}
    }
  };

  if (typeof widget === 'string') {
    // Define the widget name
    msg.d.d.widget = widget;
  } else if (typeof widget === 'object') {
    // The whole `d` object was provided
    msg.d.d = widget;
  }

  if (typeof params === 'object') {
    // The `params` object has been provided
    msg.d.d.params = params;
  } else {
    // `params` was not provided, shift the other arguments
    callback = pid;
    pid = params;
  }

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else {
    callback = pid;
  }

  this.rpcManager.makeRequest(msg, callback);
};

remoteCalls.prototype.setupComponent = function (component, pid, callback){
  var msg = {
    h: {},
    a: 'signal',
    d: {
      a: 'setupComponent',
      d: {}
    }
  };

  if (typeof component === 'string') {
    // A single component's name without any params provided
    msg.d.d = {
      c: component
    };
  } else if (typeof component === 'object') {
    // The whole `d` object or an array of objects was provided
    msg.d.d = component;
  }

  if (typeof pid === 'string' || typeof pid === 'number') {
    // This message is intented for a single participant.
    msg.h.pid = pid;
  } else {
    callback = pid;
  }

  this.rpcManager.makeRequest(msg, callback);
};

module.exports = remoteCalls;