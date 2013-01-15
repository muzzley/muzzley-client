var ee = require('./emitter.js');

ee.on('teste', function(err,opts){
  console.log(opts);
});
