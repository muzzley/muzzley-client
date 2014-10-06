var Eventify = require('eventify');

/**
 *
 *
 * Emits:
 * - 'joined'
 * - 'quit'
 * 
 * @param {[type]} options [description]
 */
var Channel = function (options) {
  Eventify.enable(this);
  options = options || {};

  this.id = options.id || null;
  this.user = options.user || null;
  this.activity = options.activity || null;
  this._remoteCalls = options._remoteCalls || null;
  // Create or Join options
  this._creationOptions = options._creationOptions || null;
};

Channel.prototype.setId = function (id) {
  this.id = id;
};

Channel.prototype.getId = function () {
  return this.id;
};

Channel.prototype.setUser = function (user) {
  this.user = user;
};

Channel.prototype.getUser = function () {
  return this.user;
};

Channel.prototype.setActivity = function (activity) {
  this.activity = activity;
};

Channel.prototype.getActivity = function () {
  return this.activity;
};

Channel.prototype.setRemoteCalls = function (remoteCalls) {
  this._remoteCalls = remoteCalls;
};

Channel.prototype.getRemoteCalls = function () {
  return this._remoteCalls;
};

Channel.prototype.setCreationOptions = function (options) {
  this._creationOptions = options;
};

Channel.prototype.getCreationOptions = function () {
  return this._creationOptions;
};



exports = module.exports = Channel;