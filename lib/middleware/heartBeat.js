
//
// heartBeat middleware
//
function hb(muzzData, next){
  //console.log(muzzData);
  // Just test if the message is well parsed or parsable
  if (typeof muzzData.data !== 'object') {
    try {
      var dataParsed = JSON.parse(muzzData.data);
      //console.log(dataParsed);
      next(dataParsed);
    } catch (e) {
      //console.log('Received an invalid non-JSON message. Ignoring.');
      return;
    }
  }

}

module.exports = hb;