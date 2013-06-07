var reqwest = require('reqwest');

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

  reqwest({
      url: 'http://errorlogger.lab.muzzley.com',
      method: 'POST',
      data: errorJson,
      success: function (resp) {
      }
  });
};





module.exports.sendError = sendError;
