var muzzley = require('../lib/node-dist.js');


muzzley.joinActivity('muzdev','923022', function(err, paticipant){

  //console.log(paticipant);
  console.log('joinedActivity');

  paticipant.on('changeWidget', function(widget){
    console.log('changeWidget recived');
  });

});