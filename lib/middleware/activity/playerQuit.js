//
// PlayerQuit middleware
//
function playerQuit(muzzData, next){

  var _this = this;
  // if is a ready signal of the 'participantQuit'
  if (muzzData.a ==='participantQuit'){
    //Check if the player exists
    if(_this.participants[muzzData.d.participantId]){

      _this.participants[muzzData.d.participantId].trigger('quit', null);
      _this.activity.trigger('participantQuit', _this.participants[muzzData.d.participantId]);

      return;
    }

  }else{
    next(muzzData);
  }

}

module.exports = playerQuit;