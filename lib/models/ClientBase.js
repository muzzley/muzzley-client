var Eventify = require('eventify');

// Base Client class to be inherited by `User` and `Activity`.
var ClientBase = function () {
  Eventify.enable(this);
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

exports = module.exports = ClientBase;