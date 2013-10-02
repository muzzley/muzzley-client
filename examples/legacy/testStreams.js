var muzzley = require('../lib/stream');

var muzzleyConnection = new muzzley();

muzzleyConnection.createActivity('your-app-token', function(err, activity){
  console.log(err, activity);
});