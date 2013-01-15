var EventEmitter = require('../lib/EventEmitter').EventEmitter;
var ee = new EventEmitter();

var nIntervId = setInterval(emitEvent, 500);

function emitEvent() {
  ee.trigger('teste', [50, 'asd']);
}

module.exports = ee;