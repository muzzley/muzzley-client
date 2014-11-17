var PubSubMessage = function (options) {
  this.raw = options.raw;
};

PubSubMessage.prototype.getRawMessage = function () {
  return this.raw;
};

PubSubMessage.prototype.getRawMessageData = function () {
  return this.getRawMessage().d;
};

PubSubMessage.prototype.getNamespace = function () {
  return this.getRawMessageData().ns;
};

PubSubMessage.prototype.getPayload = function () {
  return this.getRawMessageData().p;
};

/**
 * Get the information of the user that published the message.
 * This info is only available for messages published by users
 * and not apps.
 * 
 * @return {object} The user info.
 */
PubSubMessage.prototype.getUser = function () {
  return this.getRawMessageData().u;
};

exports = module.exports = PubSubMessage;