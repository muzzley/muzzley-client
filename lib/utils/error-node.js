var request = require('request');

var protocolVersion =  '1.2.0';
var library = 'javascript nodejs';
var libraryVersion = '0.3.8';

var sendError = function(error, secure){

  var url = 'errorlogger.muzzley.com';
  if (secure) {
    url = 'https://' + url;
  } else {
    url = 'http://' + url;
  }

  request.post(url,
    { form:
      {
        library: library,
        libraryVersion:libraryVersion,
        protocolVersion:protocolVersion,
        error: JSON.stringify(error)
      }
    },
    function (error, response, body) {
  });
};


module.exports.sendError = sendError;
