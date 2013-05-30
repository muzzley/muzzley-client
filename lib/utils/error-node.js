var request = require('request');

var sendError = function(error){
  request.post('http://localhost:3000/',
    { form:
      {
        library: 'javascript',
        error: JSON.stringify(error)
      }
    },
    function (error, response, body) {
      console.log(body); // Print the google web page.
  });
};


module.exports.sendError = sendError;
