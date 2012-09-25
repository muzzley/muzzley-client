define(function() {

  var MuzzleyConnectionManager = function() {

    console.log('At the Muzzley Connection Manager constructor');
    var self = this;
    this.rpcSubscriptionId = false;
    
    this.sessionId = '123';
    this.client = Stomp.client('http://' + window.location.hostname + ':55674/stomp');
    
    
    this.generateCorrelationId = function() {
      return "cor1";
    };
    
    this.makeRpcCall = function(queue, data) {
      //self.client.send('/topic/rpc', {}, {m: 'method1', d:{data1: 1, data2: 2}});
      this.client.send(
        queue, 
        {
          'correlation-id': this.generateCorrelationId(),
          'reply-to': '/temp-queue/test'
        }, 
        JSON.stringify(data));
    };
    
    this.getRpcResponse = function(message) {
      console.log("RPC Response received");
      console.log(message);
    };
    
    this.authenticate = function() {
      // The authentication rpc request result should contain the session id
//      this.makeRpcCall(function(resultl) {
//      });
//      this.makeRpcCall('/amq/queue/rpc', "Test String!");
      //this.makeRpcCall('/amq/queue/rpc', {m: 'method1', d:{data1: 1, data2: 2}});
      this.makeRpcCall('/exchange/authentication/authenticate', {m: 'method1', d:{data1: 1, data2: 2}});
    };
    
    this.onConnect = function() {
      //self.rpcSubscriptionId = self.client.subscribe("/amq/queue/rpcResponse", self.getRpcResponse);
      /////self.rpcSubscriptionId = self.client.subscribe("/exchange/testExchange/rpcResponse", self.getRpcResponse);

      self.rpcSubscriptionId = self.client.subscribe("/exchange/authentication/#", function(message) {
        console.log("RECEIVED A MESSAGE AT THE EMPTY QUEUE");
        console.log(message);
      });


      setTimeout(function() {
        self.authenticate();
       
//        self.rpcSubscriptionId = self.client.subscribe("/reply-queue/0", function() {
//          console.log("»»»»»»»»»»»»»» RECEIVED");
//        });

      }, 1000);
      
     
      

    };
    
    this.onError = function(arg) {
      console.log('Error:');
      console.log(arg);
    };
    
  };
  
  MuzzleyConnectionManager.prototype = {
    pubMethod: function() {
      this.x = true;
      return this.x;
    }
  }
  
  MuzzleyConnectionManager.prototype.connect = function() {
      Stomp.WebSocketClass = SockJS;

//      this.client.debug = function(m, p) {
//        p = (p === undefined) ? '' : JSON.stringify(p);
//        console.log("DEBUG: " + m + ' ' + p);
//      };
      
      this.client.connect('guest', 'guest', this.onConnect, this.onError, '/');
      
  }

  return MuzzleyConnectionManager;
});