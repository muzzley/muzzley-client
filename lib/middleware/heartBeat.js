
//
// heartBeat middleware
//
function hb(muzzData, next){
  //console.log(muzzData);
  // Just test if the message is well parsed or parsable
  if (typeof muzzData.data !== 'object') {
    try {
      var dataParsed = JSON.parse(muzzData.data);
    } catch (e) {
      this.trigger('error', 'cant parse the recived message');
      return;
    }
    next(dataParsed);
  }

}

module.exports = hb;