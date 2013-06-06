//
//  mediaStream middleware
//  Intercepts the mediaStream iniciative
//
function mediaStreamInvite(muzzData, next){
  console.log(muzzData);
  var _this = this;
  if (muzzData.d  && muzzData.a === 'receiveMediaStream') {
    //Check if the player exists
    if(_this.participants[muzzData.d.participantId]){
      _this.participants[muzzData.d.participantId].trigger('sendMediaStream', muzzData.d);
      _this.remoteCalls.successResponse(muzzData.h);
      next(muzzData);
    }
  }else{
    next(muzzData);
  }
}

module.exports = mediaStreamInvite;