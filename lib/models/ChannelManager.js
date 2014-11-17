var prefix = 'ch_';

var getKey = function (channel) {
  var channelId;
  if (typeof channel === 'undefined' || channel === null) {
    // Backward compatibility - if no channel-based communication is available
    channelId = '__default__';
  } else {
    channelId = (typeof channel === 'string') ? channel : channel.id;
  }
  return (prefix + channelId);
};

var ChannelManager = function () {
  this.channelCount = 0;
  this.channels = {};

  this._defaultChannelId = null;
};

ChannelManager.prototype.add = function (channel) {
  var key = getKey(channel);
  if (!this.channels[key]) {
    this.channelCount++;
  }
  this.channels[key] = channel;
};

ChannelManager.prototype.get = function (channel) {
  var key = getKey(channel);
  return this.channels[key];
};

ChannelManager.prototype.remove = function (channel) {
  var key = getKey(channel);
  if (this.channels[key]) {
    this.channelCount--;
  }
  delete this.channels[key];
};

ChannelManager.prototype.getCount = function () {
  return this.channelCount;
};

ChannelManager.prototype.getAll = function() {
  var self = this;
  return Object.keys(self.channels).map(function (k) { return self.channels[k]; });
};

exports = module.exports = ChannelManager;