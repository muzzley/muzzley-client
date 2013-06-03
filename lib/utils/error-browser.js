var request = require('browser-request');

var protocolVersion =  '1.0';
var library = 'javascript browser';
var libraryVersion = '0.3.0';

var sendError = function(error){
  var errorJson= {
    library: library,
    libraryVersion:libraryVersion,
    protocolVersion:protocolVersion,
    error: JSON.stringify(error)
  };

  request({method:'POST', url:'http://localhost:3000/', json:errorJson}, function (error, response, body) {
      console.log(body);
  });
};





module.exports.sendError = sendError;
