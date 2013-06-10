var muzzley = require('../lib/node-dist.js');


muzzley.joinActivity('user-token','activity-code', function(err, paticipant){
  if (err) return console.log('err:' +  err);
  //console.log(paticipant);
  console.log('joinedActivity');
  paticipant.on('changeWidget', function(widget){
    console.log('changeWidget recived');
  });

});
