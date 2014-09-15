var ClientBase = require('./ClientBase');
var inherits = require('../utils/inherits');

/**
 * The Activity object is the result of invoking the
 * muzzley.connectApp() method and creating a new
 * muzzley activity.
 *
 */
var Activity = function (options) {
  ClientBase.call(this);
  this.updateProperties(options);
};
inherits(Activity, ClientBase);

Activity.prototype.updateProperties = function (options) {
  for (var key in options) {
    this[key] = options[key];
  }
};

exports = module.exports = Activity;
