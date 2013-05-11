// Simple Util function that recives a object 
// and allows you to access to is properties 
// without worring to handle errors if properties doen't exist
//
// Example Usage:
// Code from: https://github.com/jclem/steeltoe
//

function steelToe (object) {
  function _steelToe (property) {
    if (object && property) {
      return steelToe(object[property]);
    } else {
      return property ? steelToe() : object;
    }
  }

  _steelToe.set = function (traversalChain, value) {
    var keys = traversalChain.split('.'),
        object = _steelToe;

    for (var i = 0; i < keys.length; i ++) {
      if (!object()[keys[i]]) {
        object()[keys[i]] = {};
      }

      if (i == keys.length - 1) {
        object()[keys[i]] = value;
      }

      object = object(keys[i]);
    }

    return value;
  };

  _steelToe.get = function (traversalChain) {
    if (traversalChain) {
      var keys = traversalChain.split('.'),
          returnObject = _steelToe, i;

      for (i = 0; i < keys.length; i += 1) {
        returnObject = returnObject(keys[i]);
      }

      return returnObject();
    } else {
      return _steelToe();
    }
  };

  return _steelToe;
}

module.exports = steelToe;
