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

  auth: function (callback){
    var msg = {
          a: 'login',
          d: {
            // Mandatory
            protocolVersion: '1.0',
            // All the following are optional and experimental
            lib: 'js',
            userAgent: 'browser angent', // TODO: logic to know wich browser is doing the request
            connection: 'Wi-Fi', //TODO: check if this is aplicable
            contentType: 'application/json',
            token: 'token1'
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
            contentType: 'application/json',
            activityId: 'activityId' // optional and only for debugging purposes for now
          }
        };

    this.rpcManager.makeRequest(msg, this.sock, callback);
  }
};

module.exports = remoteCalls;