define(['muzzley'],function(muzzley) {

  var id;
  var name;
  var icon;
  var version;
  var releaseDate;
//  var developer;
  var description;
  var rating;

  var getId = function() {
    return id;
  }
  
  var getName = function() {
    return name;
  }
  
  var getIcon = function() {
    return icon;
  }

  var getVersion = function() {
    return version;
  }

  var getReleaseDate = function() {
    return releaseDate;
  }

//  var getDeveloper = function() {
//    return developer;
//  }

  var getDescription = function() {
    return description;
  }

  var getRating = function() {
    return rating;
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
