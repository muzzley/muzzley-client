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
  // Make the participant dynamic so that new fields
  // introduced by the muzzley servers are immediatelly
  // received without having to update the lib.
  for(var key in options) {
    this[key] = options[key];
  }

  Eventify.enable(this);
};

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

exports = module.exports = Participant;