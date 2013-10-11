var messageTypes = require('../../utils/messageTypes');

//
// PlayerJoin middleware
//
function transformControl(muzzData, next){
  var _this = this;
  // if is a transform control unit request
  if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST && muzzData.a === 'signal' && muzzData.d.a ==='changeWidget'){
    //Check if the player exists
    if (_this._user) {
      _this.remoteCalls.successResponse(muzzData.h);
      _this.trigger('changeWidget', muzzData.d.d);
      _this._user.trigger('changeWidget', muzzData.d.d);
    }
  }else{
    next(muzzData);
  }

}

module.exports = transformControl;