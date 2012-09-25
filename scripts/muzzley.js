define(['muzzleyConnectionManager', 'activity'], function(MuzzleyConnectionManager, Activity) {
  
  var Muzzley = function(appKey) {
    this.connectionManager = new MuzzleyConnectionManager();
    
    this.appKey = appKey;
    
    this.connected = false;
    this.authenticated = false;
    
    this.activity = null;
    
    this.paused = false; // this should be state = [connected, paused]
    
  };
  
  Muzzley.prototype = {
    connect: function() {
      
      this.connectionManager.connect();
      this.connected = true;
      return this.connected;
    },
    authenticate: function() {
      if (!this.connected) {
        this.connect();
      }
    },
    createActivity: function() {
      var activity = new Activity();
      
      this.activity = activity;
    },
    getActivity: function() {
      return this.activity;
    }
  }

  return Muzzley;
});
//define(['activity'], function() {
//  var appKey;
//  
//  var connected;
//  var authenticated
//  
//  var activity;
//  
//  var connect = function() {
//    connected = true;
//    return connected;
//  }
//  
//  var authenticate = function(applicationKey) {
//    appKey = applicationKey;
//    if (!connected) {
//      connect();
//    }
//  }
//  
//  var createActivity = function() {
//    
//  }
//  
//  var getActivity = function() {
//    return activity;
//  }
//  
//  return {
//    authenticate: authenticate,
//    getActivity: getActivity
//  };
//  
//});
