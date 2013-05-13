//Protocol message codes
var MESSAGE_TYPE_REQUEST = 1;
var MESSAGE_TYPE_RESPONSE = 2;
var MESSAGE_TYPE_REQUEST_CORE = 3;
var MESSAGE_TYPE_RESPONSE_CORE = 4;
var MESSAGE_TYPE_SIGNAL = 5;

//
// PlayerJoin middleware
//
function transformControl(muzzData, next){
  var _this = this;
  // if is a transform control unit request
  if (muzzData.h.t  === MESSAGE_TYPE_REQUEST && muzzData.a === 'signal' && muzzData.d.a ==='changeWidget'){
    //Check if the player exists
    _this.remoteCalls.successResponse(muzzData.h);
    _this.trigger('changeWidget', muzzData.d);
    _this.participant.trigger('changeWidget', muzzData.d);
  }else{
    next(muzzData);
  }

}

module.exports = transformControl;