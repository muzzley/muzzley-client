define(function() {

  var activityId;
  var users = [];
  
  var getQrCode = function(callback) {
    // TODO: implement
    // Example URL: http://muzzley.com/activity/a40349adfjafd
    var imgUrl = 'http://ideaviews.com/wp-content/uploads/2012/08/qr-code_rusocial_media_ready.png';
    callback(imgUrl);
  }
  
  // TODO: This might not make sense
  // The callback method's first argument is an Image object
  var getQrCodeImage = function(callback) {
    
    getQrCode(function(imgUrl) {
      var qrCodeImage = new Image();
      qrCodeImage.onload(callback);
      qrCodeImage.src = imgUrl;
    });

  }
  
  var getActivityIdentifier = function() {
    return activityId;
  }
  
//  var getNfcCode = function() {
//    
//  }
  
  var getUsers = function() {
    return users;
  }
  
  var destroyActivity = function() {
    // TODO: implement
  }
  
  // Activities must have event listeners for the userJoined and userQuit events
  // But the client app can also register for these events. This activity object
  // is responsible for these notifications.
  var userJoined = function(user) {
    
  }
  var userQuit = function(user) {
    
  }

  return {
    destroyActivity: destroyActivity,
    getActivityIdentifier: getActivityIdentifier,
    getQrCodeImage: getQrCodeImage,
    getUsers: getUsers
  };
  
});
