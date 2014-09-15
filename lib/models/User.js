var ClientBase = require('./ClientBase');
var inherits = require('../utils/inherits');
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
 */
var User = function (options) {
  ClientBase.call(this);
  this.updateProperties(options);
};
inherits(User, ClientBase);

User.prototype.updateProperties = function (options) {
  // Make the user dynamic so that new fields
  // introduced by the muzzley servers are immediatelly
  // received without having to update the lib.
  for (var key in options) {
    this[key] = options[key];
  }
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

exports = module.exports = User;
