var Eventify = require('eventify');

/**
 * An idle connection monitor. If no data is received
 * for a certain amount of time (1 minute by default), we consider
 * that the connection has become idle (eg: half-open TCP connection)
 * and notify any interested party of it. The monitor stops once
 * an idle connection is detected.
 *
 * Emitted events:
 * - idle: function (options)
 *         Emitted once the connection is considered idle.
 *         `options` is an object with the following properties:
 *         - lastMessageTime: The timestamp in ms at which the last message was received.
 * 
 * 
 * 
 * @param {object} options Optional parametrization:
 *                         - idleTime: Integer. After how many ms of receiving the
 *                           last message is the connetion considered idle.
 *                           Deafult: 60000.
 *                         - checkInterval: Integer. At what intervals, in ms,
 *                           should we check if the connection has become idle.
 *                           Default: 5000.
 * 
 */
var IdlingMonitor = function (options) {
  var self = this;

  options = options || {};

  var lastMessageTime = null;
  var CHECK_INTERVAL = options.checkInterval || 5000;
  var IDLE_TIME = options.idleTime || 60000;
  var timer = null;

  this.start = function () {
    clearInterval(timer);
    timer = setInterval(function () {
      if (lastMessageTime === null || ((lastMessageTime + IDLE_TIME) < new Date().getTime())) {
        self.stop();

        self.trigger('idle', { lastMessageTime: lastMessageTime });
      }
    }, CHECK_INTERVAL);
  };

  this.stop = function () {
    clearInterval(timer);
  };

  this.middleware = function (muzzData, next) {
    lastMessageTime = new Date().getTime();
    console.log('Idling monitor new lastMessageTime: ' + new Date(lastMessageTime));
    return next(muzzData);
  };

  Eventify.enable(this);
};

exports = module.exports = IdlingMonitor;