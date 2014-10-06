var ClientBase = require('./ClientBase');
var inherits = require('../utils/inherits');
var Eventify = require('eventify');
var SharingContextSender = require('./SharingContext').Sender;

var sharingManager = require('../../lib/middleware/fileShare').sharingManager;

/**
 * The Participant object represents a user that joined
 * the current activity.
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
var Participant = function (options) {
  ClientBase.call(this);
  this.updateProperties(options);
  for(var key in options) {
    this[key] = options[key];
  }

  Eventify.enable(this);
};
inherits(Participant, ClientBase, true);

Participant.prototype.changeWidget = function(widget, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    this._remoteCalls.changeWidget(widget, this.id, callback);
  } else {
    this._remoteCalls.changeWidget(widget, params, this.id, callback);
  }
};

Participant.prototype.setupComponent = function(component, callback) {
  this._remoteCalls.setupComponent(component, this.id, callback);
};

Participant.prototype.sendSignal = function(type, data, callback) {
  this._remoteCalls.sendSignal(type, data, this.id, callback);
};

Participant.prototype.createSharingContext = function(context) {
  var sharingSender = new SharingContextSender(context, {
    _receiverPid: this.id,
    _remoteCalls: this._remoteCalls
  });

  sharingManager.registerSender(sharingSender);
  return sharingSender;
};

Participant.prototype.quit = function (callback) {
  // Override ClientBase.quit() as that's not an option for participants.
  return callback(new Error('Cannot call quit() on a Participant.'));
};

exports = module.exports = Participant;