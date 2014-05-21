var request = require('request');
var pkg = require('../../package.json');

var library = 'js-node';
var libraryVersion = pkg.version;
var protocolVersion =  pkg.protocolVersion;

var sendError = function (error, secure) {

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
    function (error, response, body) {}
  );
};

module.exports = sendError;