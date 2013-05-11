//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// PlayerJoin middleware
//
function playerQuit(muzzData, next){

  var _this = this;
  // if is a ready signal of the 'participantQuit'
  if (muzzData.a ==='participantQuit'){
    //Check if the player exists
    if(_this.participants[muzzData.d.participantId]){
      console.log('weeee');

      _this.participants[muzzData.d.participantId].trigger('quit', null);
      _this.activity.trigger('participantQuit', _this.participants[muzzData.d.participantId]);

      return;
    }

  }else{
    next(muzzData);
  }

}

module.exports = playerQuit;