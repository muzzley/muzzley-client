var ClientBase = require('./ClientBase');
var inherits = require('../utils/inherits');


var getParticipantKey = function (participant) {
  return ((typeof participant === 'object') ? participant.id : participant);
};

/**
 * The Activity object is the result of invoking the
 * muzzley.connectApp(), initApp() or .create() methods and
 * creating a new muzzley activity.
 *
 */
var Activity = function (options) {
  ClientBase.call(this);
  this.updateProperties(options);
  this.participants = {};
  this._numParticipants = 0;
};
inherits(Activity, ClientBase, true);

Activity.prototype.addParticipant = function (participant) {
  var key = getParticipantKey(participant);
  if (!this.participants[key]) {
    this._numParticipants++;
  }
  this.participants[key] = participant;
};

Activity.prototype.getParticipant = function (participantId) {
  var key = getParticipantKey(participantId);
  return this.participants[key];
};

/**
 * Returns all active participants as an object indexed by the participant id.
 * @return {[type]} [description]
 */
Activity.prototype.getAllParticipantsIndexed = function () {
  return this.participants;
};

/**
 * Returns all active participants as an array.
 * 
 * @return {Array}
 */
Activity.prototype.getAllParticipants = function () {
  var self = this;
  return Object.keys(self.participants).map(function (k) { return self.participants[k]; });
};

Activity.prototype.removeParticipant = function (participant) {
  var key = getParticipantKey(participant);
  if (this.participants[key]) {
    this._numParticipants--;
  }
  delete this.participants[key];
};

Activity.prototype.removeAllParticipants = function (participant) {
  this._numParticipants = 0;
  this.participants = {};
};

Activity.prototype.getParticipantCount = function () {
  return this._numParticipants;
};

exports = module.exports = Activity;
