var Eventify = require('eventify');
var SharingContextReceiver = require('../models/SharingContext').Receiver;
var SharingContextEvents = require('../models/SharingContext').Events;

var activeContexts = {};

var SharingManager = function () {
  Eventify.enable(this);
};

SharingManager.prototype.hasContext = function(context) {
  return (typeof activeContexts['ctx_' + context] !== 'undefined');
};

SharingManager.prototype.getContext = function(context) {
  return activeContexts['ctx_' + context];
};

SharingManager.prototype.registerSender = function(sharingContextSender) {
  activeContexts['ctx_' + sharingContextSender.context] = sharingContextSender;
};

SharingManager.prototype.registerReceiver = function(sharingContextReceiver) {
  activeContexts['ctx_' + sharingContextReceiver.context] = sharingContextReceiver;
};

var sharingManager = new SharingManager();

//
//  fileShare middleware
//  Intercepts the file sharing initiation
//
function fileShareInvite(muzzData, next){
  var _this = this;
  if (muzzData.d  && muzzData.d.a === 'sharingInvitation') {

    var participant = _this._user || _this.participants[muzzData.h.pid];
    if (participant) {

      // The new way to receive sharing invitations
      // Encapsulate the whole file sharing session
      // in an object that emits its own events.
      var sharingContext = new SharingContextReceiver({
        context: muzzData.d.d.context,
        filesCount: muzzData.d.d.filesCount,
        totalSize: muzzData.d.d.totalSize,
        _senderPid: muzzData.h.pid || null,
        _remoteCalls: _this.remoteCalls
      });
      sharingManager.registerReceiver(sharingContext);
      participant.trigger('sharingInvite', sharingContext, function (accept, reason) {
        _this.remoteCalls.fileShareInvitationResponse(muzzData.h, accept, reason);
      });

      // For backwards compatibility, keep supporting
      // the splattered events on the user itself.
      participant.trigger('sharingInvitation', muzzData.d.d, function (accept, reason) {
        _this.remoteCalls.fileShareInvitationResponse(muzzData.h, accept, reason);
      });
      next(muzzData);
    }
  }else{
    next(muzzData);
  }
}

//
//  reciveFile middleware
//  Triggers sharingFile everytime the assetsPicket starts sending a file
//
function receiveFile(muzzData, next){
  var _this = this;
  if (muzzData.d  && muzzData.a === 'receiveFile') {

    var participant = _this._user || _this.participants[muzzData.d.participantId];
    if(participant){

      var context = sharingManager.getContext(muzzData.d.context);
      if (context) {
        context.trigger('file', muzzData.d);
      }

      participant.trigger('sharingFile', muzzData.d);
    }
    next(muzzData);
  }else{
    next(muzzData);
  }
}

//
//  sharingEnd middleware
//  Triggers sharingEnd when a file sharing session is terminated
//
function sharingEnd(muzzData, next){

  var _this = this;
  if (muzzData.d  && muzzData.d.a === 'sharingEnd') {

    var participant = _this._user || _this.participants[muzzData.h.pid];
    if(participant){

      var context = sharingManager.getContext(muzzData.d.context);
      if (context) {
        context.trigger('end', muzzData.d.d);
      }

      participant.trigger('sharingEnd', muzzData.d.d);
      _this.remoteCalls.successResponse(muzzData.h);
    }

    next(muzzData);
  }else{
    next(muzzData);
  }
}


//
//  sharingCancel middleware
//  Triggers when a sharing session is canceled
//
function sharingCancel(muzzData, next){

  var _this = this;
  if (muzzData.d  && muzzData.d.a === 'sharingCancel') {

    var participant = _this._user || _this.participants[muzzData.h.pid];
    if (participant) {

      var context = sharingManager.getContext(muzzData.d.context);
      if (context) {
        context.trigger('cancel', muzzData.d.d);
      }

      participant.trigger('sharingCancel', muzzData.d.d);
      _this.remoteCalls.successResponse(muzzData.h);
    }

    next(muzzData);
  }else{
    next(muzzData);
  }
}

module.exports.sharingManager = sharingManager;

module.exports.fileShareInvite = fileShareInvite;
module.exports.receiveFile = receiveFile;
module.exports.sharingEnd = sharingEnd;
module.exports.sharingCancel = sharingCancel;