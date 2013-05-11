var muzzley = require('../lib/stream');

var muzzleyConnection = new muzzley();

muzzleyConnection.createActivity('muzzlionaire', function(err, activity){
  console.log(err, activity);
});