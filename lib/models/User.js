var Eventify = require('eventify');
var SharingContextSender = require('./SharingContext').Sender;

var sharingManager = require('../../lib/middleware/fileShare').sharingManager;

/**
 * The User object is the result of invoking the
 * muzzley.connectUser() method and joining
 * an ongoing activity. It simulates what the
 * muzzley smartphone applications do.
 *
 * Events:
 * - sharingInvite
 *
 * Deprecated Events (kept for backwards compatibility)
 * - sharingInvitation
 * - sharingFile
 * - sharingEnd
 * - sharingCancel
 *
 *
 *
 */
var User = function (options) {

  this.id = options.id;
  this.name = options.name;
  this.photoUrl = options.photoUrl;

  this._remoteCalls = options._remoteCalls;

  Eventify.enable(this);

};

User.prototype.sendWidgetData = function(data) {
  this._remoteCalls.sendWidgetData(data);
};

User.prototype.sendSignal = function (type, data, callback) {
  this._remoteCalls.sendSignal(type, data, callback);
};

User.prototype.sendReady = function (callback) {
  this._remoteCalls.sendReady(function (err, data) {
    if (err) return callback(err);
    if (data && data.s === true) {
      return callback(null, true);
    }
    return callback(null, false);
  });
};

User.prototype.createSharingContext = function(context) {
  var sharingSender = new SharingContextSender(context, {
    _remoteCalls: this._remoteCalls
  });

  sharingManager.registerSender(sharingSender);
  return sharingSender;
};

User.prototype.quit = function (callback) {

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

exports = module.exports = User;
