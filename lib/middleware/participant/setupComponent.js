var messageTypes = require('../../utils/messageTypes');

//
// Component setup (enable, disable, update) middleware
//
function setupComponent(muzzData, next){
  var _this = this;
  // Check if it is a setupComponent request
  if (muzzData.h.t  === messageTypes.MESSAGE_TYPE_REQUEST && muzzData.a === 'signal' && muzzData.d.a ==='setupComponent'){
    //Check if the player exists
    if (_this._user) {
      _this.remoteCalls.successResponse(muzzData.h);
      _this.trigger('setupComponent', muzzData.d.d);
      _this._user.trigger('setupComponent', muzzData.d.d);
    }
  }else{
    next(muzzData);
  }

}

module.exports = setupComponent;