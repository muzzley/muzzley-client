
//
// heartBeat middleware
//
function hb(muzzData, next){
  // Just test if the message is well parsed or parsable
  if (typeof muzzData.data !== 'object') {
    var dataParsed;
    try {
      dataParsed = JSON.parse(muzzData.data);
      if (dataParsed.d && dataParsed.d.w == 'hb' && dataParsed.d.v == 'hb'
        && dataParsed.d.e == 'hb' && dataParsed.d.c == 'hb') {
        // A heartbeat, ignore it.
        return;
      }
    } catch (e) {
      // Just silently ignore any non-JSON message. It could be a heartbeat.
      return;
    }
    next(dataParsed);
  }

}

module.exports = hb;