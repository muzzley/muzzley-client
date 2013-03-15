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

remoteCalls.prototype.widgetData= function (data){
  var msg = {
    h: {
      t: 5
    },
    a: 'signal',
    d: data
  };
  this.sock.send(JSON.stringify(msg));
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