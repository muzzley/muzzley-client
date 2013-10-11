var Eventify = require('eventify');

var SharingContextEvents = {
  INVITATION: 'invitation',
  FILE: 'file',
  CANCEL: 'cancel',
  END: 'end'
};

/**
 *
 * Emits the following events:
 * - cancel: The receiving party has canceled
 * 
 */
var SharingContextSender = function (context, options) {
  this.context = context;

  this._receiverPid = options._receiverPid || null;
  this._remoteCalls = options._remoteCalls;

  Eventify.enable(this);
};

SharingContextSender.prototype.invite = function(options, callback) {
  var opts = {
    context: this.context,
    filesCount: options.filesCount,
    totalSize: options.totalSize
  };
  this._remoteCalls.sendSharingInvitation(opts, this._receiverPid, callback);
};

SharingContextSender.prototype.shareFile = function(options, callback) {
  var opts = {
    context: this.context,
    fileName: options.fileName,
    contentType: options.contentType
  };
  this._remoteCalls.shareFile(opts, this._receiverPid, callback);
};

SharingContextSender.prototype.cancel = function(callback) {
  this._remoteCalls.sharingCancel(this.context, this._receiverPid, callback);
};

SharingContextSender.prototype.end = function(callback) {
  this._remoteCalls.sharingEnd(this.context, this._receiverPid, callback);
};


/**
 *
 * Emits the following events:
 *
 * - file: We're receiving a request to start downloading a new file of this context.
 * - cancel: The sending party has canceled this sharing context.
 * - end: The sending party has marked the sharing session as complete.
 */
var SharingContextReceiver = function (options) {
  this.context = options.context;
  this.filesCount = options.filesCount;
  this.totalSize = options.totalSize;

  this._senderPid = options._senderPid || null;
  this._remoteCalls = options._remoteCalls;

  Eventify.enable(this);
};

/**
 * This file sharing receiver wants to cancel this sharing session.
 */
SharingContextReceiver.prototype.cancel = function (callback) {
  this._remoteCalls.sharingCancel(this.context, this._senderPid, callback);
};

module.exports.Events = SharingContextEvents;
module.exports.Sender = SharingContextSender;
module.exports.Receiver = SharingContextReceiver;