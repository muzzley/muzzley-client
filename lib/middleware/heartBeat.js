
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
      console.log(e.message);
      return;
    }
    next(dataParsed);
  }

}

module.exports = hb;