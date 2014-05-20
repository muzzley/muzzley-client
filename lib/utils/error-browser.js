var reqwest = require('reqwest');
var pkg = require('../../package.json');

var library = 'javascript browser';
var libraryVersion = pkg.version;
var protocolVersion =  pkg.protocolVersion;

var sendError = function(error, secure){
  var errorJson= {
    library: library,
    libraryVersion:libraryVersion,
    protocolVersion:protocolVersion,
    error: JSON.stringify(error)
  };

  var url = 'errorlogger.muzzley.com';
  if (secure) {
    url = 'https://' + url;
  } else {
    url = 'http://' + url;
  }

  reqwest({
      url: url,
      method: 'POST',
      data: errorJson,
      success: function (resp) {
      }
  });
};





module.exports.sendError = sendError;
