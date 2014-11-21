var Eventify = require('eventify');

// Base Client class to be inherited by `User` and `Activity`.
var ClientBase = function () {
  Eventify.enable(this);
};

ClientBase.fromMessage = function (clientObject, remoteCalls) {
  var clientProps = this.parseProperties(clientObject);
  clientProps._remoteCalls = remoteCalls;
  return new this(clientProps);
};

ClientBase.parseProperties = function (clientObject) {
  var clientProps = {};
  for(var key in clientObject) {
    clientProps[key] = clientObject[key];
  }
  return clientProps;
};

ClientBase.prototype.updateProperties = function (options) {
  // Make the user dynamic so that new fields
  // introduced by the muzzley servers are immediatelly
  // received without having to update the lib.
  for (var key in options) {
    this[key] = options[key];
  }
};

ClientBase.prototype.quit = function (callback) {
  var self = this;
  this._remoteCalls.quit(function(err, data) {

    // Notify any listener that the user has become invalid.
    // The listener can close this sessions socket connection.
    self.trigger('quitPerformed');

    if (typeof callback !== 'function') return;

    if (err) return callback(err);
    if (data && data.s === true) {
      return callback(null, true);
    }
    return callback(null, false);
  });
};

ClientBase.prototype.setRemoteCalls = function (remoteCalls) {
  this._remoteCalls = remoteCalls;
};

exports = module.exports = ClientBase;