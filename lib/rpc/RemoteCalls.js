function remoteCalls (options) {
  options = options || {};
  remoteCalls.$.sock = options.sock;
  remoteCalls.$.rpcManager = options.rpcManager;
  return remoteCalls.$;
}

remoteCalls.$ = { 
  rpcManager: {},
  sock: {},
  handshake: function (callback){
    var msg = {
          a: 'handshake',
          d: {
            // Mandatory
            protocolVersion: '1.0',
            // All the following are optional and experimental
            lib: 'js',
            userAgent: 'brwoser angent', // TODO: logic to know wich browser is doing the request
            connection: 'Wi-Fi', //TODO: check if this is aplicable
            contentType: 'application/json'
          }
        };

    this.rpcManager.makeRequest(msg, this.sock, callback);
  },

  auth: function (token, callback){
    var msg = {
          a: 'loginApp',
          d: {
            // Mandatory
            protocolVersion: '1.0',
            // All the following are optional and experimental
            lib: 'js',
            userAgent: 'browser angent', // TODO: logic to know wich browser is doing the request
            connection: 'Wi-Fi', //TODO: check if this is aplicable
            contentType: 'application/json',
            token: token
          }
        };

    this.rpcManager.makeRequest(msg, this.sock, callback);
  },

  createActivity: function (callback){
    var msg = {
      a: 'create',
      d: {
        protocolVersion: '1.0',
        lib: 'js',
        libVersion: '0.1'
      }
    };

    this.rpcManager.makeRequest(msg, this.sock, callback);
  },

  successResponse: function (type, cid, pid){
    var msg = {
      h: {t: type, cid: cid, pid: pid},
      s: true
    };
    console.log(msg);
    this.sock.send(JSON.stringify(msg));
  },

  changeWidget: function (widget, pid, callback){
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
    console.log(msg);
    this.rpcManager.makeRequest(msg, this.sock, callback);
  }
};

module.exports = remoteCalls;