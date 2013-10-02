//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// PlayerAction middleware
//
function playerAction(muzzData, next){
  var _this = this;
  // if is a ready signal of the 'participantJoin'
  if (muzzData.h.t  === MESSAGE_TYPE_SIGNAL && muzzData.h.pid && muzzData.d.a === undefined ){
    //Check if the player exists
    if(_this.participants[muzzData.h.pid]){
      _this.participants[muzzData.h.pid].trigger('action', muzzData.d);
      next(muzzData);
    }

  }else{
    next(muzzData);
  }

}

module.exports = playerAction;