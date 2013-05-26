//Protocol message codes
var MESSAGE_TYPE_SIGNAL = 5;

//
// PlayerJoin middleware
//
function btnA(muzzData, next){
  var _this = this;
  // if is a ready signal of the 'participantJoin'
  if (muzzData.h.t  === MESSAGE_TYPE_SIGNAL && muzzData.h.pid){
    //Check if the player exists
    if(_this.participants[muzzData.h.pid]){
      if (muzzData.d.e === 'press' && muzzData.d.c === 'ba' ){
        _this.trigger('buttonA', _this.participants[muzzData.h.pid]);
        return;
      }
    }

  }else{
    next(muzzData);
  }

}

module.exports = btnA;