var request = require('browser-request');

var sendError = function(error){
  var errorJson= {
        library: 'javascript',
        error: JSON.stringify(error)
      };

  request({method:'POST', url:'http://localhost:3000/', json:errorJson}, function (error, response, body) {
      console.log(body); // Print the google web page.
  });
};





module.exports.sendError = sendError;
