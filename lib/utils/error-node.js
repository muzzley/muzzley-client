var request = require('request');

var protocolVersion =  '1.0';
var library = 'javascript nodejs';
var libraryVersion = '0.3.0';

var sendError = function(error){
  request.post('http://errorlogger.lab.muzzley.com',
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
