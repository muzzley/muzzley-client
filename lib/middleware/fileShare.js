
//
//  fileShare middleware
//  Intercepts the file sharing initiation
//
function fileShareInvite(muzzData, next){
  var _this = this;
  if (muzzData.d  && muzzData.d.a === 'sharingInvitation') {
    //Check if the player exists
    if(_this.participants[muzzData.h.pid]){
      _this.participants[muzzData.h.pid].trigger('sharingInvitation', muzzData.d, function(accept, reason){
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
    //Check if the player exists
    if(_this.participants[muzzData.d.participantId]){
      _this.participants[muzzData.d.participantId].trigger('sharingFile', muzzData.d);
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
    //Check if the player exists
    if(_this.participants[muzzData.h.pid]){
      _this.participants[muzzData.h.pid].trigger('sharingEnd', muzzData.d);
      _this.remoteCalls.successResponse(muzzData.h);
    }
    next(muzzData);
  }else{
    next(muzzData);
  }
}



module.exports.fileShareInvite = fileShareInvite;
module.exports.receiveFile = receiveFile;
module.exports.sharingEnd = sharingEnd;