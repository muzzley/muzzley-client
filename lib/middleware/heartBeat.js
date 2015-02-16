
//
// heartBeat middleware
//
function hb(muzzData, next){
  // Just test if the message is well parsed or parsable
  if (typeof muzzData.data !== 'object') {
    if (muzzData.data === 'h') {
      // A heartbeat. Send it back to the server and
      // don't process it any further.
      try {
        this.__send('h');
      } catch (e) {}
      return;
    }
    var dataParsed;
    try {
      dataParsed = JSON.parse(muzzData.data);
      if (dataParsed.d && dataParsed.d.w == 'hb' && dataParsed.d.v == 'hb'
        && dataParsed.d.e == 'hb' && dataParsed.d.c == 'hb') {
        // A legacy heartbeat, ignore it.
        return;
      }
    } catch (e) {
      // Just silently ignore any non-JSON message.
      return;
    }
    next(dataParsed);
  }

}

module.exports = hb;