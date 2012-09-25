define(['muzzley'],function(Muzzley) {

  var id;
  var name;
  var photoUrl;

  var getId = function() {
    return id;
  }
  
  var getName = function() {
    return name;
  }
  
  var getPhoto = function() {
    return photoUrl;
  }
  
  var switchWidget = function(widget) {
    
  }
  
//  var sendMessage = function() {}
  
  return {
    getId: getId,
    getName: getName,
    getPhoto: getPhoto,
//    sendMessage: sendMessage,
    switchWidget: switchWidget    
  };
  
});
