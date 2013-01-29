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
            // Mandatory
            protocolVersion: '1.0',
            // All the following are optional and experimental
            lib: 'js',
            userAgent: 'browser angent', // TODO: logic to know wich browser is doing the request
            connection: 'Wi-Fi', //TODO: check if this is aplicable
            contentType: 'application/json'
            //activityId: 'activityId2' // optional and only for debugging purposes for now
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

  changeWidget: function (pid, callback){
    var msg = {
      h: {
        pid: pid
      },
      a: 'signal',
      d: {
        a: 'changeWidget',
        d:{
            widget: 'gamepad',
            backgroundImage: 'http://www.muzzley.com/images/image1.png',
            numButtons: 4
          }
      }
    };
    console.log(msg);
    this.rpcManager.makeRequest(msg, this.sock, callback);
  }
};

module.exports = remoteCalls;